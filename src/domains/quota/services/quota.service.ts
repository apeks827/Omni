import quotaRepository from '../repositories/quota.repository.js'

interface UsageResponse {
  usage: {
    daily: { limit: number; used: number; remaining: number; resetAt: string }
    weekly: { limit: number; used: number; remaining: number; resetAt: string }
    monthly: { limit: number; used: number; remaining: number; resetAt: string }
  }
  alerts: {
    daily: boolean
    weekly: boolean
    monthly: boolean
  }
}

interface LimitsResponse {
  limits: {
    daily: number
    weekly: number
    monthly: number
  }
}

class QuotaService {
  async getUsage(userId: string): Promise<UsageResponse> {
    const quota = await quotaRepository.findByUserId(userId)

    const defaultQuota = {
      daily_quota: 1000,
      daily_used: 0,
      weekly_quota: 5000,
      weekly_used: 0,
      monthly_quota: 20000,
      monthly_used: 0,
    }

    const data = quota || defaultQuota
    const now = new Date()
    const dailyResetAt = new Date(quota?.daily_reset_at || now)
    const weeklyResetAt = new Date(quota?.weekly_reset_at || now)
    const monthlyResetAt = new Date(quota?.monthly_reset_at || now)

    const usage = {
      daily: {
        limit: data.daily_quota,
        used: data.daily_used,
        remaining: Math.max(0, data.daily_quota - data.daily_used),
        resetAt: dailyResetAt.toISOString(),
      },
      weekly: {
        limit: data.weekly_quota,
        used: data.weekly_used,
        remaining: Math.max(0, data.weekly_quota - data.weekly_used),
        resetAt: weeklyResetAt.toISOString(),
      },
      monthly: {
        limit: data.monthly_quota,
        used: data.monthly_used,
        remaining: Math.max(0, data.monthly_quota - data.monthly_used),
        resetAt: monthlyResetAt.toISOString(),
      },
    }

    const alertThresholds = {
      daily: usage.daily.remaining / usage.daily.limit <= 0.1,
      weekly: usage.weekly.remaining / usage.weekly.limit <= 0.1,
      monthly: usage.monthly.remaining / usage.monthly.limit <= 0.1,
    }

    return {
      usage,
      alerts: alertThresholds,
    }
  }

  async getLimits(userId: string): Promise<LimitsResponse> {
    const quota = await quotaRepository.findByUserId(userId)

    const limits = quota || {
      daily_quota: 1000,
      weekly_quota: 5000,
      monthly_quota: 20000,
    }

    return {
      limits: {
        daily: limits.daily_quota,
        weekly: limits.weekly_quota,
        monthly: limits.monthly_quota,
      },
    }
  }

  async updateLimits(
    userId: string,
    limits: { daily?: number; weekly?: number; monthly?: number }
  ): Promise<LimitsResponse> {
    const updatedQuotas = await quotaRepository.updateLimits(userId, limits)

    return {
      limits: {
        daily: updatedQuotas.daily_quota,
        weekly: updatedQuotas.weekly_quota,
        monthly: updatedQuotas.monthly_quota,
      },
    }
  }
}

export default new QuotaService()
