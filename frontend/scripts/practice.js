// practice.js
console.log("practice.js loaded");

document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get("userId");
    if (!userId) return alert("No user ID in URL");
    initUploadButtons(userId);
    loadUserScore(userId);
    loadUserQuizzes(userId);
    initMusicToggle();
});

function initUploadButtons(userId) {
    const pdfBtn = document.getElementById("upload-pdf-button");
    const textBtn = document.getElementById("upload-text-button");

    pdfBtn?.addEventListener("click", async () => {
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = ".pdf";
        fileInput.click();

        fileInput.onchange = async () => {
            const file = fileInput.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append("pdf", file);

            try {
                const res = await fetch("http://localhost:5000/api/summarize", {
                    method: "POST",
                    body: formData
                });

                const data = await res.json();
                if (data.error) return alert(data.error);

                // Use the summary to generate a quiz
                await generateQuiz(userId, data.summary);
            } catch (err) {
                console.error(err);
                alert("Failed to process PDF");
            }
        };
    });

    textBtn?.addEventListener("click", async () => {
        const text = prompt("Paste the text to generate a quiz:");
        if (!text) return;

        await generateQuiz(userId, text);
    });
}

async function generateQuiz(userId, text) {
     const statusDiv = document.getElementById("quiz-status");
    if (!statusDiv) return;
    try {
          statusDiv.textContent = "📄 Summarizing content... please wait...";
        const res = await fetch(`http://localhost:5000/${userId}/api/generate-quiz`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text })
        });
         statusDiv.textContent = "⏳ Generating quiz... please wait...";
        const data = await res.json();
        if (data.error) return alert(data.error);

        // Optionally parse quizText into structured format
        // Assuming your backend returns structured JSON like:
        // [{question: "Q1", options: ["A","B","C","D"], correct:"B", explanation:"..."}, ...]

        alert("Quiz generated successfully! Check your Practice grid.");
        statusDiv.textContent= "";
        loadUserQuizzes(userId); // refresh the practice grid to show new quiz

    } catch (err) {
        console.error(err);
        alert("Failed to generate quiz");
    }
}

// ===== Music Toggle =====
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

// ===== Load user score =====
async function loadUserScore(userId) {
    try {
        const res = await fetch(`http://localhost:5000/auth/${userId}`);
        const data = await res.json();
        document.querySelector(".practice-points").textContent =
            `CURRENT POINTS: ${data.score || 0}`;
    } catch (err) {
        console.error("Failed to load score:", err);
    }
}

// ===== Load quizzes =====
async function loadUserQuizzes(userId) {
    try {
        const res = await fetch(`http://localhost:5000/quiz/${userId}/my-quizzes`);
        const data = await res.json();

        const container = document.querySelector(".practice-grid");
        container.innerHTML = ""; // clear existing buttons

        if (!data.quizzes || !data.quizzes.length) {
            container.textContent = "No quizzes available.";
            return;
        }

        data.quizzes.forEach((quiz, index) => {
            const btn = document.createElement("button");
            btn.className = "practice-card practice-start-button";
            btn.textContent = `QUIZ #${index + 1}`;
            btn.addEventListener("click", () => {
                window.location.href = `quiz_page.html?userId=${userId}&quiz=${index}`;
            });
            container.appendChild(btn);
        });
    } catch (err) {
        console.error("Failed to load quizzes:", err);
    }
}
