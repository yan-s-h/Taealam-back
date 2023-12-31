import passport from 'passport'
import passportLocal from 'passport-local'
import passportJWT from 'passport-jwt'
import bcrypt from 'bcrypt'
import users from '../models/users.js'

passport.use('login', new passportLocal.Strategy({
  usernameField: 'account',
  passwordField: 'password'
}, async (account, password, done) => {
  try {
    const user = await users.findOne({ account })
    if (!user) {
      throw new Error('USER')
    }
    if (!bcrypt.compareSync(password, user.password)) {
      throw new Error('PASSWORD')
    }
    return done(null, user)
  } catch (error) {
    console.log(error)
    if (error.message === 'USER') {
      return done(null, false, { message: 'Account not found' })
    } else if (error.message === 'PASSWORD') {
      return done(null, false, { message: 'Incorrect password' })
    } else {
      return (error, false, { message: 'Error' })
    }
  }
}))

passport.use('jwt', new passportJWT.Strategy({
  jwtFromRequest: passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
  passReqToCallback: true,
  // 忽略過期檢查
  ignoreExpiration: true
}, async (req, payload, done) => {
  try {
    // 檢查過期狀態
    // payload.exp是解譯出來的JWT過期時間，單位是秒
    // Date.now()單位是毫秒
    const expired = payload.exp * 1000 < Date.now()

    /*
  http://localhost:4000/users/me?aaa=111
  req.originalUrl->/users/me?aaa=111
  req.basUrl->/users
  req.path->/me
  req.baseUrl + req.path->/users/me
  req.query->{aaa:111}
   */
    const url = req.baseUrl + req.path
    if (expired && url !== '/users/extend' && url !== '/users/logout') {
      throw new Error('EXPIRED')
    }
    const token = req.headers.authorization.split(' ')[1]
    const user = await users.findOne({ _id: payload._id, tokens: token })
    if (!user) {
      // console.log(payload)
      throw new Error('NO USER')
    }
    return done(null, { user, token })
  } catch (error) {
    console.log(error)
    if (error.message === 'EXPIRED') {
      return done(null, false, { message: 'Session expired' })
    } else if (error.message === 'NO USER') {
      return done(null, false, { message: 'Invalid user or JWT' })
    } else {
      return done(error, false, { message: 'Error' })
    }
  }
}))
