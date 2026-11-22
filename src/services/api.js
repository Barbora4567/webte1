import axios from 'axios'

const API_BASE_URL = 'https://wt1zadanie.iolab.sk'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

export default {
  // GET /api/{name}
  getTodos(studentName) {
    const encodedName = encodeURIComponent(studentName.trim())
    return apiClient.get(`/api/${encodedName}`)
  },

  // POST /api/{name}
  createTodo(studentName, todoData) {
    const encodedName = encodeURIComponent(studentName.trim())
    return apiClient.post(`/api/${encodedName}`, todoData)
  },

  // PUT /api/{name}/{todo_id}
  updateTodo(studentName, todoId, todoData) {
    const encodedName = encodeURIComponent(studentName.trim())
    return apiClient.put(`/api/${encodedName}/${todoId}`, todoData)
  },

  // DELETE /api/{name}/{todo_id}
  deleteTodo(studentName, todoId) {
    const encodedName = encodeURIComponent(studentName.trim())
    return apiClient.delete(`/api/${encodedName}/${todoId}`)
  },

  // PATCH /api/{name}/{todo_id}/done
  markDone(studentName, todoId) {
    const encodedName = encodeURIComponent(studentName.trim())
    return apiClient.patch(`/api/${encodedName}/${todoId}/done`)
  },

  // PATCH /api/{name}/{todo_id}/undone 
  markUndone(studentName, todoId) {
    const encodedName = encodeURIComponent(studentName.trim())
    return apiClient.patch(`/api/${encodedName}/${todoId}/undone`)
  },

  // POST /api/{name}/reset
  resetTodos(studentName) {
    const encodedName = encodeURIComponent(studentName.trim())
    return apiClient.post(`/api/${encodedName}/reset`)
  }
}