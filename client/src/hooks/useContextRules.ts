import { useState, useEffect } from 'react'
import { useContext } from './useContext'
import {
  contextRulesEngine,
  RuleEvaluationResult,
  ContextRule,
  TaskSuggestion,
} from '../services/contextRulesEngine'

export function useContextRules() {
  const context = useContext()
  const [results, setResults] = useState<RuleEvaluationResult[]>([])
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([])

  useEffect(() => {
    if (!context) return

    const evaluationResults = contextRulesEngine.evaluateRules(context)
    setResults(evaluationResults)

    const allSuggestions = evaluationResults.flatMap(r => r.suggestions)
    setSuggestions(allSuggestions)
  }, [context])

  useEffect(() => {
    const unsubscribe = contextRulesEngine.subscribe(evaluationResults => {
      setResults(evaluationResults)
      const allSuggestions = evaluationResults.flatMap(r => r.suggestions)
      setSuggestions(allSuggestions)
    })

    return unsubscribe
  }, [])

  return { results, suggestions }
}

export function useContextRulesManager() {
  const [rules, setRules] = useState<ContextRule[]>(
    contextRulesEngine.getRules()
  )

  const addRule = (rule: Omit<ContextRule, 'id'>) => {
    const newRule = contextRulesEngine.addRule(rule)
    setRules(contextRulesEngine.getRules())
    return newRule
  }

  const updateRule = (id: string, updates: Partial<ContextRule>) => {
    const updated = contextRulesEngine.updateRule(id, updates)
    if (updated) {
      setRules(contextRulesEngine.getRules())
    }
    return updated
  }

  const deleteRule = (id: string) => {
    const deleted = contextRulesEngine.deleteRule(id)
    if (deleted) {
      setRules(contextRulesEngine.getRules())
    }
    return deleted
  }

  return { rules, addRule, updateRule, deleteRule }
}
