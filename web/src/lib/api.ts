import axios from 'axios'

const api = axios.create({
  baseURL: typeof window === 'undefined'
    ? (process.env.INTERNAL_API_URL ?? 'http://api:8000') + '/api'
    : '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('kite_access_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Public auth flows must never be kicked to /login (would break UX)
      const path = window.location.pathname
      const isPublicAuth = ['/login', '/cadastro', '/recuperar-senha', '/redefinir-senha', '/verificar-email']
        .some((p) => path === p || path.startsWith(p + '/'))
      const refresh = localStorage.getItem('kite_refresh_token')
      if (refresh) {
        try {
          const { data } = await axios.post('/api/auth/refresh', { refreshToken: refresh })
          localStorage.setItem('kite_access_token', data.accessToken)
          error.config.headers.Authorization = `Bearer ${data.accessToken}`
          return api(error.config)
        } catch {
          localStorage.removeItem('kite_access_token')
          localStorage.removeItem('kite_refresh_token')
        }
      } else {
        localStorage.removeItem('kite_access_token')
        localStorage.removeItem('kite_refresh_token')
      }
      if (!isPublicAuth && !path.startsWith('/login')) {
        try { window.location.href = '/login' } catch { /* noop */ }
      }
    }
    return Promise.reject(error)
  }
)

export default api

// ── Typed helpers ─────────────────────────────────────────────────────────
export const authApi = {
  register:    (body: unknown) => api.post('/auth/register', body),
  login:       (body: unknown) => api.post('/auth/login', body),
  refresh:     (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
  forgotPw:    (email: string) => api.post('/auth/forgot-password', { email }),
  resetPw:     (body: unknown) => api.post('/auth/reset-password', body),
  verifyEmail: (token: string) => api.get(`/auth/verify-email?token=${token}`),
  me:          () => api.get('/auth/me'),
}

export const listingsApi = {
  list:    (params?: Record<string, string | number>) => api.get('/listings', { params }),
  get:     (id: string) => api.get(`/listings/${id}`),
  create:  (body: unknown) => api.post('/listings', body),
  update:  (id: string, body: unknown) => api.patch(`/listings/${id}`, body),
  delete:  (id: string) => api.delete(`/listings/${id}`),
  mine:    (params?: Record<string, string | number>) => api.get('/listings/mine', { params }),
  boost:   (id: string, body: unknown) => api.post(`/listings/${id}/boost`, body),
  report:  (id: string, body: unknown) => api.post(`/listings/${id}/report`, body),
}

export const chatApi = {
  conversations: () => api.get('/chat/conversations'),
  messages:      (convId: string) => api.get(`/chat/conversations/${convId}/messages`),
  send:          (convId: string, body: unknown) => api.post(`/chat/conversations/${convId}/messages`, body),
  startConv:     (listingId: string) => api.post('/chat/conversations', { listingId }),
}

export const usersApi = {
  profile:       (id: string) => api.get(`/users/${id}/profile`),
  updateProfile: (body: unknown) => api.patch('/users/me', body),
  verify:        (body: unknown) => api.post('/users/me/verify', body),
  report:        (id: string, body: unknown) => api.post(`/users/${id}/report`, body),
}

export const reviewsApi = {
  mine:     () => api.get('/reviews/mine'),
  forUser:  (id: string) => api.get(`/reviews/user/${id}`),
  create:   (body: unknown) => api.post('/reviews', body),
}

export const favoritesApi = {
  list:    () => api.get('/favorites'),
  toggle:  (listingId: string) => api.post(`/favorites/${listingId}`),
}

export const plansApi = {
  list:     () => api.get('/plans'),
  checkout: (body: unknown) => api.post('/checkout', body),
}

export const bannersApi = {
  forSlot:   (slot: string) => api.get(`/banners/slot/${slot}`),
  impression:(id: string) => api.post(`/banners/${id}/impression`),
  click:     (id: string) => api.post(`/banners/${id}/click`),
}

export const adminApi = {
  stats:         () => api.get('/admin/stats'),
  users:         (params?: Record<string, string | number>) => api.get('/admin/users', { params }),
  listings:      (params?: Record<string, string | number>) => api.get('/admin/listings', { params }),
  reports:       (params?: Record<string, string | number>) => api.get('/reports', { params }),
  banners:       (params?: Record<string, string | number>) => api.get('/admin/banners', { params }),
  createBanner:  (body: unknown) => api.post('/admin/banners', body),
  updateBanner:  (id: string, b: unknown) => api.patch(`/admin/banners/${id}`, b),
  deleteBanner:  (id: string) => api.delete(`/admin/banners/${id}`),
  moderateReport:(id: string, action: string, actionTaken?: string) => api.put(`/reports/${id}/status`, { status: action, actionTaken }),
  banUser:       (id: string) => api.post(`/admin/users/${id}/ban`),
  verifyUser:    (id: string) => api.post(`/admin/users/${id}/verify`),
}

export const commissionApi = { list: () => api.get('/commissions'), get: (module: string) => api.get(`/commissions/${module}`), upsert: (module: string, body: unknown) => api.put(`/commissions/${module}`, body) }
export const kiteSchoolApi = { listCategories: ()=>api.get('/kite-school/categories'), createCategory: (body: unknown)=>api.post('/kite-school/categories', body), listCourses: (params?: Record<string, string | number>)=>api.get('/kite-school/courses',{params}), getCourse: (id: string)=>api.get(`/kite-school/courses/${id}`), createCourse: (body: unknown)=>api.post('/kite-school/courses', body), updateCourse: (id: string,body: unknown)=>api.put(`/kite-school/courses/${id}`, body), deleteCourse: (id: string)=>api.delete(`/kite-school/courses/${id}`), listLessons: (courseId: string)=>api.get(`/kite-school/courses/${courseId}/lessons`), createLesson: (courseId: string, body: unknown)=>api.post(`/kite-school/courses/${courseId}/lessons`, body), updateLesson: (id: string,body: unknown)=>api.put(`/kite-school/lessons/${id}`, body), deleteLesson: (id: string)=>api.delete(`/kite-school/lessons/${id}`), enroll: (courseId: string, body: unknown)=>api.post(`/kite-school/courses/${courseId}/enroll`, body), myEnrollments: ()=>api.get('/kite-school/enrollments/mine'), lessonProgress: (lessonId: string, body: unknown)=>api.post(`/kite-school/lessons/${lessonId}/progress`, body), courseProgress: (courseId: string)=>api.get(`/kite-school/courses/${courseId}/progress`) }
export const trainingApi = { listTrainers: (params?: Record<string, string | number>)=>api.get('/training/trainers',{params}), getTrainer: (id: string)=>api.get(`/training/trainers/${id}`), createTrainer: (body: unknown)=>api.post('/training/trainers', body), updateTrainer: (body: unknown)=>api.put('/training/trainers/me', body), listServices: (params?: Record<string, string | number>)=>api.get('/training/services',{params}), getService: (id: string)=>api.get(`/training/services/${id}`), createService: (body: unknown)=>api.post('/training/services', body), slots: (serviceId: string, date: string)=>api.get(`/training/services/${serviceId}/slots`,{params:{date}}), book: (serviceId: string, body: unknown)=>api.post(`/training/services/${serviceId}/book`, body), myBookings: ()=>api.get('/training/bookings/mine'), received: ()=>api.get('/training/bookings/received'), updateBooking: (id: string, body: unknown)=>api.put(`/training/bookings/${id}/status`, body) }
export const propertiesApi = { list: (params?: Record<string, string | number>)=>api.get('/properties',{params}), get: (id: string)=>api.get(`/properties/${id}`), create: (body: unknown)=>api.post('/properties', body), update: (id: string,body: unknown)=>api.put(`/properties/${id}`, body), delete: (id: string)=>api.delete(`/properties/${id}`), mine: ()=>api.get('/properties/mine') }
export const accommodationsApi = { list: (params?: Record<string, string | number>)=>api.get('/accommodations',{params}), get: (id: string)=>api.get(`/accommodations/${id}`), create: (body: unknown)=>api.post('/accommodations', body), update: (id: string,body: unknown)=>api.put(`/accommodations/${id}`, body), delete: (id: string)=>api.delete(`/accommodations/${id}`), availability: (id: string, params?: Record<string, string | number>)=>api.get(`/accommodations/${id}/availability`,{params}), book: (id: string, body: unknown)=>api.post(`/accommodations/${id}/book`, body), myBookings: ()=>api.get('/accommodations/bookings/mine'), hostBookings: ()=>api.get('/accommodations/host/bookings') }
export const vehiclesApi = { list: (params?: Record<string, string | number>)=>api.get('/vehicles',{params}), get: (id: string)=>api.get(`/vehicles/${id}`), create: (body: unknown)=>api.post('/vehicles', body), update: (id: string,body: unknown)=>api.put(`/vehicles/${id}`, body), delete: (id: string)=>api.delete(`/vehicles/${id}`) }
export const blogApi = { list: (params?: Record<string, string | number>)=>api.get('/blog',{params}), getBySlug: (slug: string)=>api.get(`/blog/${slug}`), create: (body: unknown)=>api.post('/blog', body), update: (id: string,body: unknown)=>api.put(`/blog/${id}`, body), delete: (id: string)=>api.delete(`/blog/${id}`) }
export const fashionApi = { list: (params?: Record<string, string | number>)=>api.get('/fashion',{params}), get: (id: string)=>api.get(`/fashion/${id}`), create: (body: unknown)=>api.post('/fashion', body), update: (id: string,body: unknown)=>api.put(`/fashion/${id}`, body) }
export const eventsApi = { list: (params?: Record<string, string | number | boolean>)=>api.get('/events',{params}), get: (id: string)=>api.get(`/events/${id}`), create: (body: unknown)=>api.post('/events', body), update: (id: string,body: unknown)=>api.put(`/events/${id}`, body), createTicketType: (eventId: string, body: unknown)=>api.post(`/events/${eventId}/ticket-types`, body), listTicketTypes: (eventId: string)=>api.get(`/events/${eventId}/ticket-types`), updateTicketType: (eventId: string, ticketTypeId: string, body: unknown)=>api.put(`/events/${eventId}/ticket-types/${ticketTypeId}`, body), deleteTicketType: (eventId: string, ticketTypeId: string)=>api.delete(`/events/${eventId}/ticket-types/${ticketTypeId}`), createOrder: (eventId: string, body: unknown)=>api.post(`/events/${eventId}/orders`, body), myOrders: (params?: Record<string, string|number>)=>api.get('/events/orders/mine',{params}), listTickets: (eventId: string, params?: Record<string, string|number>)=>api.get(`/events/${eventId}/tickets`,{params}), listEventOrders: (eventId: string, params?: Record<string, string|number>)=>api.get(`/events/${eventId}/orders`,{params}), checkin: (body: unknown)=>api.post('/events/tickets/checkin', body), payFeatured: (eventId: string, body: unknown)=>api.post(`/events/${eventId}/featured/pay`, body) }
export const servicesApi = { list: (params?: Record<string, string | number>)=>api.get('/services',{params}), get: (id: string)=>api.get(`/services/${id}`), create: (body: unknown)=>api.post('/services', body), orders: { create: (serviceId: string, body: unknown)=>api.post(`/services/${serviceId}/orders`, body), mine: ()=>api.get('/services/orders/mine'), received: ()=>api.get('/services/orders/received') } }
export const paymentsApi = { create: (body: unknown)=>api.post('/payments', body), mine: ()=>api.get('/payments/mine'), confirm: (id: string)=>api.post(`/payments/${id}/confirm`) }
