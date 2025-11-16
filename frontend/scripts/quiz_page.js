// quiz_page.js
console.log("quiz_page.js loaded");

const nextBtn = document.getElementById("next-question-btn");
const submitBtn = document.getElementById("submit-quiz-btn");
let QUIZ_DATA = [];
let currentQuestionId = 1;
let quizIndex;   // global
const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get("userId");

document.addEventListener("DOMContentLoaded", () => {

    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get("userId");
    const quizIndex = parseInt(urlParams.get("quiz"));

    if (!userId || isNaN(quizIndex)) {
        return alert("Missing user ID or quiz index in URL");
    }

    loadSelectedQuiz(userId, quizIndex);
    initMusicToggle();
});

// ===== Music Toggle (same as practice) =====
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

// ===== Load selected quiz =====
async function loadSelectedQuiz(userId, quizIndex) {
    try {
        const res = await fetch(`http://localhost:5000/quiz/${userId}/my-quizzes`);
        const data = await res.json();

        if (!data.quizzes || !data.quizzes[quizIndex]) {
            console.error("Quiz not found");
            return;
        }

        QUIZ_DATA = data.quizzes[quizIndex].questions.map((q, i) => ({
            id: i + 1,
            text: q.question,
            options: q.options,
            correct: q.correct,
            explanation: q.explanation,
            user_answer: null
        }));

        renderQuiz();
        renderNavigationCircles();
    } catch (err) {
        console.error("Failed to load quiz:", err);
    }
}

// ===== Render quiz question =====
function renderQuiz() {
    loadQuestion(currentQuestionId);
}

// function loadQuestion(newQuestionId) {
//     const question = QUIZ_DATA.find(q => q.id === newQuestionId);
//     if (!question) return console.error("Invalid question:", newQuestionId);

//     const content = document.getElementById("question-content");
//     if (!content) return;

//     content.innerHTML = generateQuestionHTML(question);
//     currentQuestionId = newQuestionId;
//     initAnswerSelection();
//     checkCompletion();
// }

function loadQuestion(newQuestionId) {
    const question = QUIZ_DATA.find(q => q.id === newQuestionId);
    if (!question) return console.error("Invalid question:", newQuestionId);

    const content = document.getElementById("question-content");
    if (!content) return;

    content.innerHTML = generateQuestionHTML(question);

    // clear feedback and explanation
    const feedbackDiv = document.getElementById("question-feedback");
    const explanationDiv = document.getElementById("question-explanation");
    if (feedbackDiv) feedbackDiv.textContent = "";
    if (explanationDiv) explanationDiv.textContent = "";
    nextBtn.disabled = !question.user_answer;
     document.querySelectorAll("#question-content .answer-button")
        .forEach(btn => btn.disabled = !!question.user_answer);

    currentQuestionId = newQuestionId;
    initAnswerSelection();
    checkCompletion();
}


function generateQuestionHTML(question) {
    let html = `<div class="question-header">
                    <span class="question-number">${question.id}.</span>
                    <div class="question-box">${question.text}</div>
                </div>
                <div class="answer-options">`;

    question.options.forEach((text, index) => {
        const letter = String.fromCharCode(65 + index);
        const selected = question.user_answer === letter ? "selected" : "";
        html += `<button class="answer-button ${selected}" data-answer="${letter}">
                    ${letter}. ${text}
                 </button>`;
    });

    html += "</div>";
    return html;
}

// ===== Answer selection =====
// function initAnswerSelection() {
//     const content = document.getElementById("question-content");
//     if (!content) return;

//     content.replaceWith(content.cloneNode(true));
//     const newContent = document.getElementById("question-content");

//     newContent.addEventListener("click", (event) => {
//         const button = event.target.closest(".answer-button");
//         if (!button) return;

//         document.querySelectorAll("#question-content .answer-button")
//             .forEach(btn => btn.classList.remove("selected"));

//         button.classList.add("selected");

//         const answer = button.dataset.answer;
//         const q = QUIZ_DATA.find(q => q.id === currentQuestionId);
//         q.user_answer = answer;

//         renderNavigationCircles();
//         checkCompletion();
//     });
// }

// function initAnswerSelection() {
//     const content = document.getElementById("question-content");
//     if (!content) return;

//     content.replaceWith(content.cloneNode(true));
//     const newContent = document.getElementById("question-content");

//     newContent.addEventListener("click", (event) => {
//         const button = event.target.closest(".answer-button");
//         if (!button) return;

//         // remove selection from others
//         document.querySelectorAll("#question-content .answer-button")
//             .forEach(btn => btn.classList.remove("selected"));

//         // mark selected
//         button.classList.add("selected");

//         const answer = button.dataset.answer;
//         const q = QUIZ_DATA.find(q => q.id === currentQuestionId);
//         q.user_answer = answer;

//         // show feedback
//         const feedbackDiv = document.getElementById("question-feedback");
//         if (answer === q.correct) {
//             feedbackDiv.textContent = "✅ Correct!";
//             feedbackDiv.style.color = "green";
//         } else {
//             feedbackDiv.textContent = `❌ Wrong! Correct answer: ${q.correct}`;
//             feedbackDiv.style.color = "red";
//         }
//          explanationDiv.textContent = q.explanation || "";
//          document.querySelectorAll("#question-content .answer-button")
//             .forEach(btn => btn.disabled = true);
//          nextBtn.disabled = false;    
//         renderNavigationCircles();
//         checkCompletion();
//     });
// }

function initAnswerSelection() {
    let content = document.getElementById("question-content");
    if (!content) return;

    // replace with clone to remove old listeners
    content.replaceWith(content.cloneNode(true));
    const newContent = document.getElementById("question-content");

    const nextBtn = document.getElementById("next-btn");
    const feedbackDiv = document.getElementById("question-feedback");
    const explanationDiv = document.getElementById("question-explanation");

    newContent.addEventListener("click", (event) => {
        const button = event.target.closest(".answer-button");
        if (!button) return;

        // remove selection from all buttons
        newContent.querySelectorAll(".answer-button")
            .forEach(btn => btn.classList.remove("selected"));

        // mark this button as selected
        button.classList.add("selected");

        const answer = button.dataset.answer;
        const q = QUIZ_DATA.find(q => q.id === currentQuestionId);
        q.user_answer = answer;

        // show feedback
        if (answer === q.correct) {
            feedbackDiv.textContent = "✅ Correct!";
            feedbackDiv.style.color = "green";
        } else {
            feedbackDiv.textContent = `❌ Wrong! Correct answer: ${q.correct}`;
            feedbackDiv.style.color = "red";
        }

        // show explanation
        explanationDiv.textContent = q.explanation || "";

        // disable all buttons
        newContent.querySelectorAll(".answer-button")
            .forEach(btn => btn.disabled = true);

        // enable next button
        if (nextBtn) nextBtn.disabled = false;

        renderNavigationCircles();
        checkCompletion();
    });
}


// ===== Navigation circles (optional) =====
function renderNavigationCircles() {
    const navContainer = document.getElementById("question-navigation");
    if (!navContainer) return;

    navContainer.innerHTML = "";
    QUIZ_DATA.forEach(q => {
        const circle = document.createElement("div");
        circle.className = "nav-circle";
        circle.dataset.questionId = q.id;
        navContainer.appendChild(circle);
    });
}

function updateNavigationCircles(activeId) {
    QUIZ_DATA.forEach(q => {
        const circle = document.querySelector(`.nav-circle[data-question-id="${q.id}"]`);
        if (!circle) return;
        circle.classList.remove("completed", "current", "unanswered");
        if (q.id === activeId) circle.classList.add("current");
        else if (q.user_answer) circle.classList.add("completed");
        else circle.classList.add("unanswered");
    });
}

// ===== Submission =====

// function checkCompletion() {
//     if (!submitBtn) return;
//     const allAnswered = QUIZ_DATA.every(q => q.user_answer !== null);
//     if (allAnswered) {
//         submitBtn.disabled = false;
//         submitBtn.classList.add("enabled");
//     } else {
//         submitBtn.disabled = true;
//         submitBtn.classList.remove("enabled");
//     }
// }

// if (submitBtn) {
//     submitBtn.addEventListener("click", () => {
//         if (submitBtn.disabled) return;
//         console.log("Quiz completed:", QUIZ_DATA);
//         window.location.href = "analysis.html";
//     });
// }

function checkCompletion() {
    if (!submitBtn) return;

    // check if all questions have answers
    const allAnswered = QUIZ_DATA.every(q => q.user_answer !== null);

    // enable submit button only if all answered
    if (allAnswered) {
        submitBtn.disabled = false;
        submitBtn.classList.add("enabled");
    } else {
        submitBtn.disabled = true;
        submitBtn.classList.remove("enabled");
    }

    // disable next button if current question not answered
    const currentQuestion = QUIZ_DATA.find(q => q.id === currentQuestionId);
    if (nextBtn && currentQuestion) {
        nextBtn.disabled = !currentQuestion.user_answer;
    }
}

// submit button click event
// if (submitBtn) {
    submitBtn.addEventListener("click", () => {
        if (submitBtn.disabled) return;
        // const userId = urlParams.get("userId");
        localStorage.setItem("quizResults", JSON.stringify(QUIZ_DATA));
        // redirect to analysis page
        window.location.href = `analysis.html?userId=${userId}`;
    });
// }

document.getElementById("next-question-btn").addEventListener("click", () => {
    const nextId = currentQuestionId + 1;
    if (nextId <= QUIZ_DATA.length) loadQuestion(nextId);
});
//practice.html?userId=6918b21a47c83715a0361a4b
//practise.html?userId=6918b21a47c83715a0361a4b