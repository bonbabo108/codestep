'use client'

import QuestionManager from '@/components/QuestionManager'
import { useDemo } from '@/components/DemoProvider'

export default function DemoQuestionManager() {
  const { repository, revision } = useDemo()
  return <QuestionManager key={revision} repository={repository} demo />
}
