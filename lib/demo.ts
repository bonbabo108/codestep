import type { Question, validateQuestionForm } from './questions'

const samples: Question[] = [
  { id: 'demo-html', category: 'HTML', title: '見出しをつくろう', question_text: 'いちばん大きな見出しで「Hello」を表示してください。', answer_code: '<h1>Hello</h1>', explanation: 'h1はページの主題を表す見出しです。開始タグと終了タグで文字を囲みます。', created_at: null },
  { id: 'demo-css', category: 'CSS', title: '文字に色をつけよう', question_text: '文字の色を青にするCSSの宣言を書いてください。', answer_code: 'color: blue;', explanation: 'colorで文字色を指定し、セミコロンで宣言を区切ります。', created_at: null },
  { id: 'demo-js', category: 'JavaScript', title: '定数のキーワード', question_text: '再代入できない変数を宣言するキーワードを書いてください。', answer_code: 'const', explanation: 'constは変数への再代入を防ぎます。オブジェクトの中身を凍結するものではありません。', created_at: null },
]


// 新しい訪問・初期化のたびに独立したサンプルを返す。永続化・外部通信なし。
export function createDemoQuestions(): Question[] {
  return samples.map(question => ({ ...question }))
}

type Fields = ReturnType<typeof validateQuestionForm>

export function saveDemoQuestion(questions: Question[], fields: Fields, id: string, editing: boolean): Question[] {
  const exists = questions.some(question => question.id === id)
  if (!id.startsWith('demo-') || (editing ? !exists : exists)) throw new Error('Invalid demo question')
  const { category, title, question_text, answer_code, explanation } = fields
  const values = { category, title, question_text, answer_code, explanation }
  return editing
    ? questions.map(question => question.id === id ? { ...question, ...values } : question)
    : [...questions, { ...values, id, created_at: null }]
}

export function deleteDemoQuestion(questions: Question[], id: string): Question[] {
  if (!id.startsWith('demo-') || !questions.some(question => question.id === id)) throw new Error('Invalid demo question')
  return questions.filter(question => question.id !== id)
}
