import { useState, useEffect, useRef, useCallback } from "react"
import { BsPercent } from "react-icons/bs"

function Board ({ width, height, bombChance }) {
    const [isGameOver, setIsGameOver] = useState(false)
    const [numOfBombs, setNumOfBombs] = useState(null)
    const [cells, setCells] = useState([])

    const build = useCallback(() => {
        setIsGameOver(false)

        let new_cells =
            Array(height).fill().map((_,y) =>
                Array(width).fill().map((_,x) => ({
                    x, y,
                    isBomb: Math.random() < bombChance,
                    isCleared: false,
                    isFlagged: false,
                    number: null,
                    isWrong: false
                }))
            )
        
        let all_bombs = 0
        for (let y = 0; y < height; y++)
        for (let x = 0; x < width; x++) {
            let cell = new_cells[y][x]
            
            if (cell.isBomb) {
                all_bombs++
                continue
            }
            
            // TODO: use forEveryCellNeighbour (make use of useCallback)
            let bombs = 0
            for (let ix = -1; ix <= 1; ix++)
            for (let iy = -1; iy <= 1; iy++) {
                let nx = x + ix
                let ny = y + iy
                
                if (ny in new_cells)
                if (nx in new_cells[ny])
                if (new_cells[ny][nx].isBomb)
                    bombs++
            }
            
            cell.number = bombs
        }
    
        setNumOfBombs(all_bombs)
        setCells(new_cells)
    }, [width, height, bombChance])


    useEffect(build, [build])


    /*
     *
     * Cell
     * 
     */

    function Cell ({ cell, handleLeftClick, handleRightClick }) {
        let className = "Cell"
        if (cell.isCleared)  className += " clear"
        if (cell.isWrong)    className += " wrong"
        if (cell.isFlagged)  className += " flag"
        if (cell.number > 0) className += ` num num${cell.number}`

        if (isGameOver)
        if (cell.isBomb)
            className += " bomb"

        return <div
            className = {className}
            onClick = {e => handleLeftClick(e, cell)}
            onContextMenu = {e => handleRightClick(e, cell)}
        >
            {cell.isFlagged &&
                <img src="flag.png" alt="flag" />
            }
            {cell.isCleared && (cell.number > 0) &&
                <div>{cell.number}</div>
            }
            {isGameOver && !cell.isFlagged && cell.isBomb &&
                <img src="bomb.png" alt="bomb" />
            }
        </div>
    }

    /*
     *
     * Helpers
     * 
     */

    function forEveryCellNeighbour (cell, callback) {
        for (let ix = -1; ix <= 1; ix++)
        for (let iy = -1; iy <= 1; iy++) {
            if (ix === 0)
            if (iy === 0)
                continue;
            let nx = cell.x + ix
            let ny = cell.y + iy
            if (ny in cells)
            if (nx in cells[ny])
                callback(cells[ny][nx])
        }
    }

    function clearCell (cell) {
        if (cell.isBomb) {
            cell.isWrong = true
            setIsGameOver(true)
            return
        }
    
        function floodClear (c) {
            if (c.isFlagged)
                return

            c.isCleared = true
            
            if (c.number === 0)
                forEveryCellNeighbour(c, nc => {
                    if (! nc.isCleared)
                        floodClear(nc)
                })
        }
        floodClear(cell)
    
        setCells([...cells])
    }

    /*
     *
     * Handlers
     * 
     */

    function handleCellLeftClick (event, cell) {
        if (isGameOver)
            return

        if (cell.isFlagged)
            return
        if (cell.isCleared) {
            if (cell.number > 0) {
                let flags = 0
                forEveryCellNeighbour(cell, nc => {
                    if (nc.isFlagged)
                        flags++
                })
                if (flags === cell.number)
                    forEveryCellNeighbour(cell, nc => {
                        if (! nc.isFlagged)
                            clearCell(nc)
                    })
            }
        }
        else clearCell(cell)
    }
    function handleCellRightClick (event, cell) {
        event.preventDefault()
        
        if (isGameOver)
            return
        if (cell.isCleared)
            return
        if (numOfBombs === 0)
            return
        
        cell.isFlagged = ! cell.isFlagged

        if (cell.isFlagged)
            setNumOfBombs(numOfBombs - 1)
        else
            setNumOfBombs(numOfBombs + 1)

        setCells([...cells]) 
    }

    function handleRestart () {
        build()
    }

    /*
     *
     * Render
     * 
     */

    let win = true
    for (let row of cells)
    for (let cell of row)
    if (! cell.isBomb)
    if (! cell.isCleared)
        win = false

    return <div className="Board">
        <div className="bombs">Bombs: {numOfBombs}</div>
        {isGameOver &&
            <div className="result lose">YOU LOST!</div>
        }
        {win &&
            <div className="result win">YOU WON!</div>
        }
        {(isGameOver || win) &&
            <center><button className="reset" onClick={handleRestart}>Restart</button></center>
        }
        {cells.map((row,i) =>
            <div key={i} className="row">
                {row.map(cell => {
                    if (isGameOver)
                    if (cell.isFlagged)
                    if (! cell.isBomb)
                        cell.isWrong = true

                    return <Cell
                        key = {`${cell.x}${cell.y}`}
                        cell = {cell}
                        handleLeftClick = {handleCellLeftClick}
                        handleRightClick = {handleCellRightClick}
                    />
                })}
            </div>
        )}
    </div>
}

function App () {
    const MIN_WIDTH = 10
    const MAX_WIDTH = 100
    const MIN_HEIGHT = 10
    const MAX_HEIGHT = 100

    const [width, setWidth] = useState(20)
    const [height, setHeight] = useState(20)
    const [bombChance, setBombChance] = useState(0.1)

    const widthInputRef = useRef(null)
    const heightInputRef = useRef(null)
    const bombChanceInputRef = useRef(null)
 
    function BoardDataRow ({ inputRef, label, defaultValue, showPercent = false }) {
        let percent_classname = "percent"
        if (! showPercent)
            percent_classname += " hide"

        return <div className="row">
            <div className="label">{label}</div>
            <input ref={inputRef} type="number" defaultValue={defaultValue} required />
            <BsPercent className={percent_classname} />
        </div>
    }

    function handleBoardDataSubmit (event) {
        event.preventDefault()

        let newWidth = widthInputRef.current.valueAsNumber
        let newHeight = heightInputRef.current.valueAsNumber
        let newBombChance = bombChanceInputRef.current.valueAsNumber

        if (newWidth < MIN_WIDTH || newWidth > MAX_WIDTH) {
            alert(`Width must be between ${MIN_WIDTH} and ${MAX_WIDTH}`)
            return
        }
        if (newHeight < MIN_HEIGHT || newHeight > MAX_HEIGHT) {
            alert(`Height must be between ${MIN_HEIGHT} and ${MAX_HEIGHT}`)
            return
        }
        if (newBombChance < 1 || newBombChance > 100) {
            alert('Bomb chance is a percentage value and must be between 1% and 100%')
            return
        }

        setWidth(newWidth)
        setHeight(newHeight)
        setBombChance(newBombChance / 100.0)
    }

    return <div className="App">
        <form className="board-data" onSubmit={handleBoardDataSubmit}>
            <BoardDataRow inputRef={widthInputRef}      label="Width"       defaultValue={width} />
            <BoardDataRow inputRef={heightInputRef}     label="Height"      defaultValue={height} />
            <BoardDataRow inputRef={bombChanceInputRef} label="Bomb Chance" defaultValue={bombChance*100} showPercent={true} />
            <button type="submit" className="submit">Submit</button>
        </form>
        <Board width={width} height={height} bombChance={bombChance} />
    </div>
}

export default App;
