import request from './axios'

/**
 * 笔记API服务
 */
export const noteAPI = {
  /**
   * 创建笔记
   * @param {Object} note - 笔记信息
   * @param {number} note.userId - 用户ID
   * @param {string} note.title - 标题
   * @param {string} note.content - 内容
   * @param {number} note.type - 类型
   * @param {number} note.isMarkdown - 是否Markdown格式
   */
  createNote(note) {
    return request({
      url: '/note/create',
      method: 'post',
      data: note
    })
  },
  
  /**
   * 更新笔记
   * @param {Object} note - 笔记信息
   */
  updateNote(note) {
    return request({
      url: '/note/update',
      method: 'put',
      data: note
    })
  },
  
  /**
   * 删除笔记
   * @param {number} noteId - 笔记ID
   * @param {number} userId - 用户ID
   */
  deleteNote(noteId, userId) {
    return request({
      url: `/note/delete/${noteId}`,
      method: 'delete',
      params: { userId }
    })
  },
  
  /**
   * 获取笔记详情
   * @param {number} noteId - 笔记ID
   * @param {number} userId - 用户ID
   */
  getNoteDetail(noteId, userId) {
    return request({
      url: `/note/detail/${noteId}`,
      method: 'get',
      params: { userId }
    })
  },
  
  /**
   * 获取用户笔记列表
   * @param {number} userId - 用户ID
   * @param {number} pageNum - 页码
   * @param {number} pageSize - 每页大小
   */
  getUserNotes(userId, pageNum = 1, pageSize = 10) {
    return request({
      url: '/note/list',
      method: 'get',
      params: { userId, pageNum, pageSize }
    })
  },
  
  /**
   * 根据类型获取用户笔记
   * @param {number} userId - 用户ID
   * @param {number} type - 笔记类型
   * @param {number} pageNum - 页码
   * @param {number} pageSize - 每页大小
   */
  getUserNotesByType(userId, type, pageNum = 1, pageSize = 10) {
    return request({
      url: '/note/listByType',
      method: 'get',
      params: { userId, type, pageNum, pageSize }
    })
  },
  
  /**
   * 搜索笔记
   * @param {number} userId - 用户ID
   * @param {string} keyword - 搜索关键词
   * @param {number} pageNum - 页码
   * @param {number} pageSize - 每页大小
   */
  searchNotes(userId, keyword, pageNum = 1, pageSize = 10) {
    return request({
      url: '/note/search',
      method: 'get',
      params: { userId, keyword, pageNum, pageSize }
    })
  }
}