import { v4 as uuidv4 } from 'uuid'

const KEY = 'mindmopper.userId'

export function getOrCreateUserId(): string {
  let id = localStorage.getItem(KEY)
  if (!id) {
    id = uuidv4()
    localStorage.setItem(KEY, id)
  }
  return id
}
