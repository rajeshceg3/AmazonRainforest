import { createContext, useContext } from 'react'
export const MotionContext=createContext(true)
export const useMotion=()=>useContext(MotionContext)
