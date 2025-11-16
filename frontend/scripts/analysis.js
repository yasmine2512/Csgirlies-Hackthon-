console.log("Analysis page loaded ✔");

const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get("userId");

// Retrieve completed quiz from localStorage
let QUIZ_DATA = JSON.parse(localStorage.getItem("quizResults")) || [];

document.addEventListener("DOMContentLoaded", () => {
    if (!QUIZ_DATA.length) {
        document.getElementById("score-summary").textContent = "No quiz data found!";
        return;
    }

    displayResults();
    initPracticeAgainButton();
    initMusicToggle();
});

// Display score and question analysis
function displayResults() {
    let score = 0;
    const analysisContainer = document.getElementById("analysis-container");
    const scoreSummary = document.getElementById("score-summary");

    analysisContainer.innerHTML = ""; // clear old content

    QUIZ_DATA.forEach((q, index) => {
        const isCorrect = q.user_answer === q.correct;
        if (isCorrect) score++;

        const div = document.createElement("div");
        div.className = "question-result";
        div.innerHTML = `
            <h3>Question ${index + 1}: ${q.text}</h3>
            <p>Your answer: ${q.user_answer || "No answer"} ${isCorrect ? "✅" : "❌"}</p>
            <p>Correct answer: ${q.correct}</p>
            <p class="explanation">${q.explanation || ""}</p>
        `;
        analysisContainer.appendChild(div);
    });

    scoreSummary.textContent = `Your Score: ${score} / ${QUIZ_DATA.length}`;

    if (userId) {
        fetch(`http://localhost:5000/auth/${userId}/add-score`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ score: score * 5 }) // 5 points per correct answer
        })
        .then(res => res.json())
        .then(data => console.log("Score updated:", data))
        .catch(err => console.error("Failed to update score:", err));
    }
}

// Practice Again button
function initPracticeAgainButton() {
    const btn = document.getElementById("practice-again-btn");
    if (!btn) return;

    btn.addEventListener("click", () => {
        if (!userId) return alert("User ID missing!");
        window.location.href = `practise.html?userId=${userId}`;
    });
}

// Music toggle
function initMusicToggle() {
    const musicButton = document.getElementById("music-toggle-button");
    if (!musicButton) return;

    let musicState = localStorage.getItem("musicState") || "on";
    updateMusicIcon(musicButton, musicState);

    musicButton.addEventListener("click", () => {
        musicState = musicState === "on" ? "off" : "on";
        localStorage.setItem("musicState", musicState);
        updateMusicIcon(musicButton, musicState);
    });
}

function updateMusicIcon(button, state) {
    button.textContent = state === "on" ? "🎶" : "🔇";
}


