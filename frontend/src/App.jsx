import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const GRID_SIZE = 9

function createShuffledNumbers() {
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9]

  for (let i = numbers.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[numbers[i], numbers[j]] = [numbers[j], numbers[i]]
  }

  return numbers
}

function App() {
  const [numbers, setNumbers] = useState([])
  const [selectedTile, setSelectedTile] = useState(null)
  const [guess, setGuess] = useState('')
  const [tileState, setTileState] = useState({})
  const [message, setMessage] = useState('')
  const tileRefs = useRef([])

  const isGameReady = numbers.length === GRID_SIZE

  const loadGame = async () => {
    setSelectedTile(null)
    setGuess('')
    setMessage('')

    try {
      const response = await fetch('/api/new-game')

      if (!response.ok) {
        throw new Error('Unable to load game')
      }

      const data = await response.json()
      if (!Array.isArray(data.numbers) || data.numbers.length !== GRID_SIZE) {
        throw new Error('Invalid game data')
      }

      setNumbers(data.numbers)
    } catch {
      setNumbers(createShuffledNumbers())
    }

    setTileState({})
  }

  useEffect(() => {
    let isCancelled = false

    const fetchGame = async () => {
      try {
        const response = await fetch('/api/new-game')

        if (!response.ok) {
          throw new Error('Unable to load game')
        }

        const data = await response.json()
        if (!Array.isArray(data.numbers) || data.numbers.length !== GRID_SIZE) {
          throw new Error('Invalid game data')
        }

        if (!isCancelled) {
          setNumbers(data.numbers)
        }
      } catch {
        if (!isCancelled) {
          setNumbers(createShuffledNumbers())
        }
      }
    }

    fetchGame()

    return () => {
      isCancelled = true
    }
  }, [])

  useEffect(() => {
    if (selectedTile !== null) {
      tileRefs.current[selectedTile]?.focus()
    }
  }, [selectedTile])

  const selectedTileIsImmutable =
    selectedTile !== null && tileState[selectedTile] !== undefined

  const submitDisabled =
    !guess || selectedTile === null || selectedTileIsImmutable || !isGameReady

  const handleSubmit = (event) => {
    event.preventDefault()

    if (submitDisabled) {
      return
    }

    const guessedNumber = Number(guess)
    const isCorrect = numbers[selectedTile] === guessedNumber

    setTileState((current) => ({
      ...current,
      [selectedTile]: isCorrect ? 'correct' : 'incorrect',
    }))

    setMessage(
      isCorrect
        ? `Correct! Tile ${selectedTile + 1} is now locked.`
        : `Wrong guess. Tile ${selectedTile + 1} is now locked.`,
    )

    setSelectedTile(null)
    setGuess('')
  }

  const allTilesLocked = useMemo(
    () => Object.keys(tileState).length === GRID_SIZE,
    [tileState],
  )

  return (
    <main className="game-container">
      <h1>Number Guessing Game</h1>
      <p>Select a tile, guess a number from 1 to 9, then submit.</p>

      <section className="grid" aria-label="3 by 3 number grid">
        {numbers.map((number, index) => {
          const status = tileState[index]
          const immutable = status !== undefined
          const classes = [
            'tile',
            selectedTile === index ? 'selected' : '',
            status === 'correct' ? 'correct' : '',
            status === 'incorrect' ? 'incorrect' : '',
          ]
            .filter(Boolean)
            .join(' ')

          return (
            <button
              key={index}
              ref={(element) => {
                tileRefs.current[index] = element
              }}
              type="button"
              className={classes}
              onClick={() => setSelectedTile(index)}
              disabled={immutable}
              aria-label={`Tile ${index + 1}`}
            >
              {immutable ? number : '?'}
            </button>
          )
        })}
      </section>

      <form className="guess-form" onSubmit={handleSubmit}>
        <label htmlFor="guess-input">Enter your guess</label>
        <input
          id="guess-input"
          type="number"
          min="1"
          max="9"
          value={guess}
          onChange={(event) => setGuess(event.target.value)}
          placeholder="1-9"
        />
        <button type="submit" disabled={submitDisabled}>
          Submit Guess
        </button>
      </form>

      <button type="button" className="restart" onClick={loadGame}>
        Restart Game
      </button>

      {selectedTile !== null && !selectedTileIsImmutable ? (
        <p className="status">Selected tile: {selectedTile + 1}</p>
      ) : null}
      {message ? <p className="status">{message}</p> : null}
      {allTilesLocked ? <p className="status">Game over. Restart to play again.</p> : null}
    </main>
  )
}

export default App
