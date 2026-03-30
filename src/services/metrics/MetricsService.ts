import { query } from '../../config/database.js'

interface KPIData {
  velocity: {
    current: number
    target: number
    status: 'healthy' | 'warning' | 'critical'
  }
  fluidity: {
    current: number
    target: number
    status: 'healthy' | 'warning' | 'critical'
  }
  quality: {
    current: number
    target: number
    status: 'healthy' | 'warning' | 'critical'
  }
  proactivity: {
    current: number
    target: number
    status: 'healthy' | 'warning' | 'critical'
  }
}

class MetricsService {
  async calculateKPIs(workspaceId: string, period: string): Promise<KPIData> {
    const days = this.parsePeriod(period)
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const velocity = await this.calculateVelocity(workspaceId, since)
    const fluidity = await this.calculateFluidity(workspaceId, since)
    const quality = await this.calculateQuality(workspaceId, since)
    const proactivity = await this.calculateProactivity(workspaceId, since)

    return {
      velocity: {
        current: velocity,
        target: 4,
        status: this.getStatus(velocity, 4, 'lower'),
      },
      fluidity: {
        current: fluidity,
        target: 0.5,
        status: this.getStatus(fluidity, 0.5, 'lower'),
      },
      quality: {
        current: quality,
        target: 90,
        status: this.getStatus(quality, 90, 'higher'),
      },
      proactivity: {
        current: proactivity,
        target: 30,
        status: this.getStatus(proactivity, 30, 'higher'),
      },
    }
  }

  async getTrends(
    workspaceId: string,
    period: string
  ): Promise<
    Array<{
      date: string
      velocity: number
      fluidity: number
      quality: number
      proactivity: number
    }>
  > {
    const days = this.parsePeriod(period)
    const dataPoints: Array<{
      date: string
      velocity: number
      fluidity: number
      quality: number
      proactivity: number
    }> = []

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000)

      const velocity = await this.calculateVelocity(workspaceId, date, nextDate)
      const fluidity = await this.calculateFluidity(workspaceId, date, nextDate)
      const quality = await this.calculateQuality(workspaceId, date, nextDate)
      const proactivity = await this.calculateProactivity(
        workspaceId,
        date,
        nextDate
      )

      dataPoints.push({
        date: date.toISOString().split('T')[0],
        velocity,
        fluidity,
        quality,
        proactivity,
      })
    }

    return dataPoints
  }

  async getBreakdown(workspaceId: string, by: string, period: string) {
    const days = this.parsePeriod(period)
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    if (by === 'agent') {
      return this.getAgentBreakdown(workspaceId, since)
    } else if (by === 'project') {
      return this.getProjectBreakdown(workspaceId, since)
    } else if (by === 'type') {
      return this.getTypeBreakdown(workspaceId, since)
    }

    return []
  }

  private async calculateVelocity(
    workspaceId: string,
    since: Date,
    until?: Date
  ): Promise<number> {
    const sql = `
      SELECT 
        AVG(EXTRACT(EPOCH FROM (completed_at - updated_at)) / 3600) as avg_hours
      FROM tasks
      WHERE workspace_id = $1
        AND status = 'completed'
        AND completed_at >= $2
        ${until ? 'AND completed_at < $3' : ''}
    `
    const params = until ? [workspaceId, since, until] : [workspaceId, since]
    const result = await query(sql, params)
    return result.rows[0]?.avg_hours || 0
  }

  private async calculateFluidity(
    workspaceId: string,
    since: Date,
    until?: Date
  ): Promise<number> {
    const sql = `
      SELECT 
        AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600) as avg_hours
      FROM tasks
      WHERE workspace_id = $1
        AND status IN ('in_progress', 'completed')
        AND created_at >= $2
        ${until ? 'AND created_at < $3' : ''}
    `
    const params = until ? [workspaceId, since, until] : [workspaceId, since]
    const result = await query(sql, params)
    return result.rows[0]?.avg_hours || 0
  }

  private async calculateQuality(
    workspaceId: string,
    since: Date,
    until?: Date
  ): Promise<number> {
    const sql = `
      SELECT 
        COUNT(*) FILTER (WHERE status = 'completed') * 100.0 / NULLIF(COUNT(*), 0) as quality_rate
      FROM tasks
      WHERE workspace_id = $1
        AND created_at >= $2
        ${until ? 'AND created_at < $3' : ''}
    `
    const params = until ? [workspaceId, since, until] : [workspaceId, since]
    const result = await query(sql, params)
    return result.rows[0]?.quality_rate || 0
  }

  private async calculateProactivity(
    workspaceId: string,
    since: Date,
    until?: Date
  ): Promise<number> {
    const sql = `
      SELECT 
        COUNT(*) FILTER (WHERE assignee_id IS NULL AND creator_id IS NOT NULL) * 100.0 / NULLIF(COUNT(*), 0) as proactivity_rate
      FROM tasks
      WHERE workspace_id = $1
        AND created_at >= $2
        ${until ? 'AND created_at < $3' : ''}
    `
    const params = until ? [workspaceId, since, until] : [workspaceId, since]
    const result = await query(sql, params)
    return result.rows[0]?.proactivity_rate || 0
  }

  private async getAgentBreakdown(workspaceId: string, since: Date) {
    const sql = `
      SELECT 
        assignee_id as agent_id,
        COUNT(*) as total_tasks,
        AVG(EXTRACT(EPOCH FROM (completed_at - updated_at)) / 3600) as avg_velocity
      FROM tasks
      WHERE workspace_id = $1
        AND status = 'completed'
        AND completed_at >= $2
        AND assignee_id IS NOT NULL
      GROUP BY assignee_id
      ORDER BY total_tasks DESC
    `
    const result = await query(sql, [workspaceId, since])
    return result.rows
  }

  private async getProjectBreakdown(workspaceId: string, since: Date) {
    const sql = `
      SELECT 
        project_id,
        COUNT(*) as total_tasks,
        AVG(EXTRACT(EPOCH FROM (completed_at - updated_at)) / 3600) as avg_velocity
      FROM tasks
      WHERE workspace_id = $1
        AND status = 'completed'
        AND completed_at >= $2
        AND project_id IS NOT NULL
      GROUP BY project_id
      ORDER BY total_tasks DESC
    `
    const result = await query(sql, [workspaceId, since])
    return result.rows
  }

  private async getTypeBreakdown(workspaceId: string, since: Date) {
    const sql = `
      SELECT 
        type,
        COUNT(*) as total_tasks,
        AVG(EXTRACT(EPOCH FROM (completed_at - updated_at)) / 3600) as avg_velocity
      FROM tasks
      WHERE workspace_id = $1
        AND status = 'completed'
        AND completed_at >= $2
      GROUP BY type
      ORDER BY total_tasks DESC
    `
    const result = await query(sql, [workspaceId, since])
    return result.rows
  }

  private parsePeriod(period: string): number {
    const match = period.match(/^(\d+)([dw])$/)
    if (!match) return 7
    const [, num, unit] = match
    return unit === 'w' ? parseInt(num) * 7 : parseInt(num)
  }

  private getStatus(
    current: number,
    target: number,
    direction: 'higher' | 'lower'
  ): 'healthy' | 'warning' | 'critical' {
    if (direction === 'lower') {
      if (current <= target) return 'healthy'
      if (current <= target * 1.5) return 'warning'
      return 'critical'
    } else {
      if (current >= target) return 'healthy'
      if (current >= target * 0.7) return 'warning'
      return 'critical'
    }
  }
}

export default new MetricsService()
