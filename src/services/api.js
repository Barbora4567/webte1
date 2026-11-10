import axios from 'axios'

const API_BASE_URL = 'https://wt1zadanie.iolab.sk'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

export default {
  // GET /api/{name} - načítanie úloh študenta
  getTodos(studentName) {
    const encodedName = encodeURIComponent(studentName.trim())
    return apiClient.get(`/api/${encodedName}`)
  },

  // POST /api/{name} - vytvorenie novej úlohy
  createTodo(studentName, todoData) {
    const encodedName = encodeURIComponent(studentName.trim())
    return apiClient.post(`/api/${encodedName}`, todoData)
  },

  // PUT /api/{name}/{todo_id} - úplná úprava úlohy
  updateTodo(studentName, todoId, todoData) {
    const encodedName = encodeURIComponent(studentName.trim())
    return apiClient.put(`/api/${encodedName}/${todoId}`, todoData)
  },

  // DELETE /api/{name}/{todo_id} - zmazanie úlohy
  deleteTodo(studentName, todoId) {
    const encodedName = encodeURIComponent(studentName.trim())
    return apiClient.delete(`/api/${encodedName}/${todoId}`)
  },

  // PATCH /api/{name}/{todo_id}/done - označenie ako dokončená
  markDone(studentName, todoId) {
    const encodedName = encodeURIComponent(studentName.trim())
    return apiClient.patch(`/api/${encodedName}/${todoId}/done`)
  },

  // PATCH /api/{name}/{todo_id}/undone - označenie ako nedokončená
  markUndone(studentName, todoId) {
    const encodedName = encodeURIComponent(studentName.trim())
    return apiClient.patch(`/api/${encodedName}/${todoId}/undone`)
  },

  // POST /api/{name}/reset - obnovenie ukážkových dát
  resetTodos(studentName) {
    const encodedName = encodeURIComponent(studentName.trim())
    return apiClient.post(`/api/${encodedName}/reset`)
  }
}