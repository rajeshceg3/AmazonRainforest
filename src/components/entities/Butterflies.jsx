import React, { useMemo } from 'react'
import Butterfly from './Butterfly'

const Butterflies = () => {
  const data = useMemo(() => {
    const arr = []
    for(let i=0; i<20; i++) {
        arr.push({
            position: [
                (Math.random() - 0.5) * 40,
                2 + Math.random() * 5,
                (Math.random() - 0.5) * 40
            ],
            key: i
        })
    }
    return arr
  }, [])

  return (
    <>
        {data.map((d) => (
            <Butterfly key={d.key} position={d.position} />
        ))}
    </>
  )
}

export default Butterflies
