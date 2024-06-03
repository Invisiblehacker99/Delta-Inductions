document.addEventListener("DOMContentLoaded", () => {
    const gameBoard = document.getElementById("board");

    const gameCells = [];
    let currentSelection = null;
    let activePlayer = "blue";
    let gameTimer;

    const maxTime = 60;

    let remainingTime = maxTime;
    const bulletVelocity = 250;

    let moveLog = [];
    let logIndex = -1;
  
    function createboard() {
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const cell = document.createElement("div");
          cell.className = "cell";
          cell.dataset.row = row;

          cell.dataset.col = col;
          gameBoard.appendChild(cell);
          gameCells.push(cell);
          cell.addEventListener("click", () => handlecellclick(row, col));
        }
      }
    }
  
    function setupgame() {
      gameCells.forEach(cell => cell.innerHTML = "");
  
      placepiece("titan", 0, 0, "red");
      placepiece("tank", 0, 1, "red");
      placepiece("tank", 3, 7, "red");
      placepiece("cannon", 0, 2, "red");
      placepiece("ricochet", 1, 2, "red");
      placepiece("semi-ricochet", 1, 4, "red");
      placepiece("ricochet", 2, 0, "red");
      placepiece("semi-ricochet", 2, 1, "red");
  
      placepiece("titan", 7, 7, "blue");
      placepiece("tank", 7, 6, "blue");
      placepiece("tank", 6, 3, "blue");
      placepiece("cannon", 7, 5, "blue");
      placepiece("ricochet", 6, 6, "blue");
      placepiece("semi-ricochet", 6, 5, "blue");
      placepiece("ricochet", 5, 7, "blue");
      placepiece("semi-ricochet", 5, 6, "blue");
    }
  
    function placepiece(pieceType, row, col, team) {
      const cell = getcell(row, col);
      if (cell) {
        const piece = document.createElement("div");
        
        piece.className = `piece ${pieceType} ${team}-team`;
        if (pieceType !== "semi-ricochet" && pieceType !== "ricochet") {
          piece.textContent = pieceType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        }
        cell.appendChild(piece);
      }
    }
  
    function getcell(row, col) {
      return gameCells.find(cell => cell.dataset.row == row && cell.dataset.col == col);
    }
  
    function handlecellclick(row, col) {
      const clickedCell = getcell(row, col);
      if (currentSelection) {
        const { pieceType, fromRow, fromCol } = currentSelection;
        if (isvalidmove(pieceType, fromRow, fromCol, row, col)) {
          if (!clickedCell.querySelector(".piece")) {
            movepiece(pieceType, fromRow, fromCol, row, col);
            if (pieceType === "cannon") {

              triggercannonfire(row, col);
            }
            currentSelection = null;
            clearhighlights();
            switchplayer();
          } else {

            currentSelection = null;
            clearhighlights();
          }
        } else {
          currentSelection = null;
          clearhighlights();
        }
      } else {
        const piece = clickedCell.querySelector(".piece");
        if (piece) {
          const pieceType = piece.className.split(" ")[1];
          const team = piece.className.split(" ")[2].split("-")[0];
          if (team === activePlayer) {
            currentSelection = { pieceType, fromRow: row, fromCol: col };

            highlightpossiblemoves(pieceType, row, col);
            if (pieceType === "semi-ricochet" || pieceType === "ricochet") {
              showrotationcontrols(piece);
            } else {
              hiderotationcontrols();
            }
          }
        }
      }
    }
  
    function showrotationcontrols(piece) {
      const rotationControls = document.getElementById("rotation-controls");
      rotationControls.style.display = "flex";

  
      document.getElementById("rotate-left").onclick = () => rotatepiece(piece, -90);
      document.getElementById("rotate-right").onclick = () => rotatepiece(piece, 90);
    }
  
    function hiderotationcontrols() {
      const rotationControls = document.getElementById("rotation-controls");
      rotationControls.style.display = "none";
    }
  
    function rotatepiece(piece, angle) {
      const currentRotation = piece.dataset.rotation ? parseInt(piece.dataset.rotation) : 0;
      const newRotation = (currentRotation + angle) % 360;
      piece.style.transform = `rotate(${newRotation}deg)`;
      piece.dataset.rotation = newRotation;
      document.getElementById("rotation").play();

    }
  
    function isvalidmove(pieceType, fromRow, fromCol, toRow, toCol) {
      const targetCell = getcell(toRow, toCol);
      const targetPiece = targetCell.querySelector(".piece");
  
      if (pieceType === "ricochet" || pieceType === "semi-ricochet") {
        if (targetPiece && targetPiece.classList.contains("titan")) {
          return false;

        }
        return Math.abs(toRow - fromRow) <= 1 && Math.abs(toCol - fromCol) <= 1;
      }
  
      if (targetPiece) {
        return false;
      }
  
      if (pieceType === "cannon") {
        return fromRow === toRow && Math.abs(toCol - fromCol) <= 1;

      }
  
      return Math.abs(toRow - fromRow) <= 1 && Math.abs(toCol - fromCol) <= 1;
    }
  
    function movepiece(pieceType, fromRow, fromCol, toRow, toCol) {
      const fromCell = getcell(fromRow, fromCol);
      const toCell = getcell(toRow, toCol);
  
      if (fromCell && toCell) {
        const piece = fromCell.querySelector(".piece");
        const targetPiece = toCell.querySelector(".piece");

  
        if (piece) {
          if (targetPiece) {
            fromCell.appendChild(targetPiece);
            toCell.appendChild(piece);
          } else {
            toCell.appendChild(piece);
          }
          document.getElementById("move").play();
          moveLog = moveLog.slice(0, logIndex + 1);
          moveLog.push({ pieceType, fromRow, fromCol, toRow, toCol });
          logIndex++;

        }
      }
    }
  
    function undomove() {
      if (logIndex >= 0) {
        const lastMove = moveLog[logIndex];
        const { pieceType, fromRow, fromCol, toRow, toCol } = lastMove;
  
        const toCell = getcell(toRow, toCol);
        const fromCell = getcell(fromRow, fromCol);
        const piece = toCell.querySelector(".piece");

        if (piece) {
          fromCell.appendChild(piece);
        }
  
        logIndex--;
        switchplayer();
      }
    }
  
    function redomove() {
      if (logIndex < moveLog.length - 1) {
        logIndex++;

        const nextMove = moveLog[logIndex];
        const { pieceType, fromRow, fromCol, toRow, toCol } = nextMove;
  
        const fromCell = getcell(fromRow, fromCol);
        const toCell = getcell(toRow, toCol);
        const piece = fromCell.querySelector(".piece");

        if (piece) {
          toCell.appendChild(piece);

        }
  
        switchplayer();
      }
    }
  
    function highlightpossiblemoves(pieceType, row, col) {

      clearhighlights();
      const possibleMoves = getpossiblemoves(pieceType, row, col);
      possibleMoves.forEach(cell => cell.classList.add("possible-move"));
    }
  

    function getpossiblemoves(pieceType, row, col) {
      const possibleMoves = [];
      for (let r = row - 1; r <= row + 1; r++) {

        for (let c = col - 1; c <= col + 1; c++) {
          if (r === row && c === col) continue;
          if (r >= 0 && r < 8 && c >= 0 && c < 8) {
            
            const cell = getcell(r, c);
            if (cell && !cell.querySelector(".piece")) {
              if (pieceType === "cannon" && r !== row) continue;
              possibleMoves.push(cell);
            }
          }
        }
      }
      return possibleMoves;
    }
  
    function clearhighlights() {
      gameCells.forEach(cell => cell.classList.remove("possible-move"));
    }
  
    function switchplayer() {
      activePlayer = activePlayer === "blue" ? "red" : "blue";
      const currentTurnElement = document.getElementById("current-turn");
      currentTurnElement.textContent = activePlayer.charAt(0).toUpperCase() + activePlayer.slice(1);
  
      if (activePlayer === "blue") {
        currentTurnElement.classList.remove("red-turn");
        currentTurnElement.classList.add("blue-turn");
      } else {
        currentTurnElement.classList.remove("blue-turn");
        currentTurnElement.classList.add("red-turn");
      }
  
      resettimer();
    }
  
    function starttimer() {
      gameTimer = setInterval(() => {
        remainingTime--;
        document.getElementById("time-left").textContent = remainingTime;
        if (remainingTime <= 0) {
          clearInterval(gameTimer);
          alert(`${activePlayer === "blue" ? "Red" : "Blue"} wins!`);
        }
      }, 1000);
    }
  
    function resettimer() {
      clearInterval(gameTimer);
      remainingTime = maxTime;

      document.getElementById("time-left").textContent = remainingTime;
      starttimer();
    }
  
    function triggercannonfire(row, col) {
      createbullet(row, col, 'up');
      createbullet(row, col, 'down');

      document.getElementById("canon-fire").play();
    }
  
    function createbullet(row, col, direction) {
      const bullet = document.createElement("div");
      bullet.className = "bullet";
      bullet.dataset.direction = direction;
      bullet.dataset.row = row;
      
      bullet.dataset.col = col;
      const cell = getcell(row, col);
      cell.appendChild(bullet);
      movebullet(bullet);
    }
  
    function movebullet(bullet) {
      setTimeout(() => {
        const direction = bullet.dataset.direction;
        const row = parseInt(bullet.dataset.row);
        const col = parseInt(bullet.dataset.col);
        let newRow = row;
        let newCol = col;
  
        if (direction === 'up') newRow--;
        if (direction === 'down') newRow++;
        if (direction === 'left') newCol--;
        if (direction === 'right') newCol++;
  
        if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
          const nextCell = getcell(newRow, newCol);
          const nextPiece = nextCell.querySelector(".piece");
  
          if (nextPiece) {
            const pieceType = nextPiece.classList[1];
            const team = nextPiece.classList[2].split("-")[0];
  
            if (pieceType === "ricochet" || pieceType === "semi-ricochet") {
              bullet.remove();
              const newDirection = getnewdirection(pieceType, direction, nextPiece.dataset.rotation);
              createbullet(newRow, newCol, newDirection);
            } else if (pieceType === "titan") {
              document.getElementById("win").play();
              if (team === "red") {
                setTimeout(() => {

                  alert("Blue team wins!");
                }, 2000);
                resetgame();
              } else if (team === "blue") {

                setTimeout(() => {
                  alert("Red team wins!");
                }, 2000);
                resetgame();
              }
              bullet.remove();
            } else if (pieceType === "tank") {
              if (direction === "up") {

                bullet.dataset.row = newRow;
                bullet.dataset.col = newCol;
                nextCell.appendChild(bullet);
                movebullet(bullet);
              } else {
                bullet.remove();
              }

            } else {
              bullet.remove();
            }
          } else {

            bullet.dataset.row = newRow;
            bullet.dataset.col = newCol;
            nextCell.appendChild(bullet);
            movebullet(bullet);
          }
        } else {
          bullet.remove();
        }
      }, bulletVelocity);
    }
  
    function getnewdirection(pieceType, direction, rotation = 0) {
      const angle = (parseInt(rotation) % 360 + 360) % 360;

      if (pieceType === "semi-ricochet") {
        if (direction === 'up') {
          if (angle === 0) return 'right';
          if (angle === 90) return 'left';
          if (angle === 180) return 'right';
          if (angle === 270) return 'left';
        }
        if (direction === 'down') {
          if (angle === 0) return 'left';
          if (angle === 90) return 'right';
          if (angle === 180) return 'left';
          if (angle === 270) return 'right';
        }
        if (direction === 'left') {
          if (angle === 0) return 'down';
          if (angle === 90) return 'up';
          if (angle === 180) return 'down';
          if (angle === 270) return 'up';
        }
        if (direction === 'right') {
          if (angle === 0) return 'up';
          if (angle === 90) return 'down';
          if (angle === 180) return 'up';
          if (angle === 270) return 'down';
        }
      }
  
      if (pieceType === "ricochet") {
        if (direction === 'up') {
          if (angle === 0) return 'down';
          if (angle === 90) return 'down';
          if (angle === 180) return 'right';
          if (angle === 270) return 'left';
        }
        if (direction === 'down') {
          if (angle === 0) return 'left';
          if (angle === 90) return 'right';
          if (angle === 180) return 'up';
          if (angle === 270) return 'up';
        }
        if (direction === 'left') {
          if (angle === 0) return 'right';
          if (angle === 90) return 'up';
          if (angle === 180) return 'down';
          if (angle === 270) return 'right';
        }
        if (direction === 'right') {
          if (angle === 0) return 'up';
          if (angle === 90) return 'left';
          if (angle === 180) return 'left';
          if (angle === 270) return 'down';
        }
      }
      return direction;
    }
  
    function resetgame() {
      clearInterval(gameTimer);
      setupgame();
      activePlayer = "blue";

      document.getElementById("current-turn").textContent = "Blue";

      document.getElementById("current-turn").classList.remove("red-turn");

      document.getElementById("current-turn").classList.add("blue-turn");
      resettimer();
    }
    document.getElementById("pause").addEventListener("click", () => clearInterval(gameTimer));
    document.getElementById("resume").addEventListener("click", starttimer);
    document.getElementById("reset").addEventListener("click", () => {
      clearInterval(gameTimer);
      remainingTime = maxTime;
      document.getElementById("time-left").textContent = remainingTime;
      activePlayer = "blue";
      clearhighlights();
      setupgame();
      resetgame();
    });
  
    document.getElementById("undo").addEventListener("click", undomove);

    document.getElementById("redo").addEventListener("click", redomove);
  
    createboard();

    setupgame();
    
    starttimer();
  });
  