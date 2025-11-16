console.log("script.js loaded");
const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get("userId");


document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM fully loaded ✔");
    const page = document.body.dataset.page; // add e.g. <body data-page="practice">
    
    if (page === "practice") {
        loadUserScore();
        loadUserQuizzes();
    } else if (page === "quiz") {
        loadSelectedQuiz();
    }
    initMusicToggle();
    initQuestionNavigation();
    initAnswerSelection();
    initUploadButtons();
    initPracticeButtons();
    // loadUserQuizzes();

    // const contentDiv = document.getElementById('question-content');
    // if (contentDiv) loadSelectedQuiz();
});

let QUIZ_DATA = [];       
let currentQuestionId = 1;
//music
function initMusicToggle() {
    const musicButton = document.getElementById("music-toggle-button");
    if (!musicButton) return;

    // read saved state from localStorage
    let musicState = localStorage.getItem("musicState") || "on";

    // apply initial state to button UI
    updateMusicIcon(musicButton, musicState);

    // set up listener to toggle & save
    musicButton.addEventListener("click", () => {
        musicState = musicState === "on" ? "off" : "on";
        localStorage.setItem("musicState", musicState);
        updateMusicIcon(musicButton, musicState);
    });
}

function updateMusicIcon(button, state) {
    button.textContent = state === "on" ? "🎶" : "🔇";
}

//nav circles
function initQuestionNavigation() {
    const navContainer = document.getElementById("question-navigation");
    if (!navContainer) return;

    navContainer.addEventListener("click", (event) => {
        const circle = event.target.closest(".nav-circle");
        if (!circle) return;

        const newId = parseInt(circle.dataset.questionId);
        loadQuestion(newId);
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


//q&a
let userAnswers = {}; 

function loadQuestion(newQuestionId) {
    const question = QUIZ_DATA.find(q => q.id === newQuestionId);
    if (!question) return console.error("Invalid question:", newQuestionId);

    const content = document.getElementById("question-content");
    if (!content) return;

    content.innerHTML = generateQuestionHTML(question);
    updateNavigationCircles(newQuestionId);
    currentQuestionId = newQuestionId;
    initAnswerSelection();
    checkCompletion();
}

function generateQuestionHTML(question) {
    let html = `
        <div class="question-header">
            <span class="question-number">${question.id}.</span>
            <div class="question-box">${question.text}</div>
        </div>
        <div class="answer-options">
    `;

    question.options.forEach((text, index) => {
        const letter = String.fromCharCode(65 + index);
        const selected = question.user_answer === letter ? "selected" : "";
        html += `<button class="answer-button ${selected}" data-answer="${letter}">
                    ${letter}. ${text}
                 </button>`;
    });

    html += `</div>`;
    return html;
}

function initAnswerSelection() {
    const content = document.getElementById("question-content");
    if (!content) return;

    content.replaceWith(content.cloneNode(true));
    const newContent = document.getElementById("question-content");

    newContent.addEventListener("click", (event) => {
        const button = event.target.closest(".answer-button");
        if (!button) return;

        // remove selection from others
        document.querySelectorAll("#question-content .answer-button")
            .forEach(btn => btn.classList.remove("selected"));

        // add to selected
        button.classList.add("selected");

        // save answer
        const answer = button.dataset.answer;
        const q = QUIZ_DATA.find(q => q.id === currentQuestionId);
        q.user_answer = answer;

        updateNavigationCircles(currentQuestionId);

        checkCompletion();
    });
}



// upload buttons
function initUploadButtons() {
    const buttons = document.querySelectorAll(".button-upload");
    if (!buttons.length) return;

    buttons.forEach(btn => btn.addEventListener("click", () => {
        const type = btn.textContent.trim().split(" ")[1];
        // alert(`Simulating upload for ${type}`);
    }));
}



function initPracticeButtons() {
    const buttons = document.querySelectorAll(".practice-start-button");
    if (!buttons.length) return;

    buttons.forEach(btn => btn.addEventListener("click", () => {
        const id = btn.dataset.practiceId;
        window.location.href = "quiz_page.html";
        // alert(`Ready to start Practice #${id}!`);
    }));
}

// submission

const submitBtn = document.getElementById("submit-quiz-btn");

function checkCompletion() {
    const allAnswered = QUIZ_DATA.every(q => q.user_answer !== null);
    
    if (allAnswered) {
        submitBtn.disabled = false;
        submitBtn.classList.add("enabled");
    } else {
        submitBtn.disabled = true;
        submitBtn.classList.remove("enabled");
    }
}



// jump to first unanswered question
function jumpToFirstUnanswered() {
    const firstUnanswered = QUIZ_DATA.find(q => q.user_answer === null);
    if (firstUnanswered) loadQuestion(firstUnanswered.id);
}

// submit button click event
submitBtn.addEventListener("click", function () {
    if (submitBtn.disabled) {
        jumpToFirstUnanswered();
        return;
    }

    const resultsData = {
        questions: QUIZ_DATA,
        answers: userAnswers
    };

    // save data to localStorage
    localStorage.setItem("quizResults", JSON.stringify(QUIZ_DATA));

    // redirect to analysis page
    window.location.href = "analysis.html";
});

async function loadUserScore() {
    const userId = new URLSearchParams(window.location.search).get("userId");
    if (!userId) return alert("No user ID in URL");

    try {
        const res = await fetch(`http://localhost:5000/auth/${userId}`);
        const data = await res.json();

        document.querySelector(".practice-points").textContent =
            `CURRENT POINTS: ${data.scores}`;
    } catch (err) {
        console.error("Failed to load score:", err);
    }
}

// async function loadUserQuizzes() {
//     const userId = new URLSearchParams(window.location.search).get("id");
//     if (!userId) return;

//     try {
//         const res = await fetch(`http://localhost:3000/users/${userId}/my-quizzes`);
//         const data = await res.json();

//         const container = document.querySelector(".practice-grid");
//         container.innerHTML = ""; // remove old Practice #1/2/3

//         data.quizzes.forEach((quiz, index) => {
//             const btn = document.createElement("button");
//             btn.className = "practice-card practice-start-button";
//             btn.dataset.quizIndex = index;
//             btn.textContent = `QUIZ #${index + 1}`;

//             btn.addEventListener("click", () => {
//                 window.location.href = `quiz_page.html?id=${userId}&quiz=${index}`;
//             });

//             container.appendChild(btn);
//         });

//     } catch (err) {
//         console.error("Failed to load quizzes:", err);
//     }
// }

// async function loadSelectedQuiz() {
//     const userId = new URLSearchParams(window.location.search).get("id");
//     const quizIndex = new URLSearchParams(window.location.search).get("quiz");

//     if (!userId || quizIndex === null) {
//         console.error("No userId or quiz index provided in URL");
//         return;
//     }

//     try {
//         const res = await fetch(`http://localhost:5000/quiz/${userId}/my-quizzes`);
//         const data = await res.json();

//         if (!data.quizzes || !data.quizzes[quizIndex]) {
//             console.error("Quiz not found in database");
//             return;
//         }

//         // Load questions from DB
//         QUIZ_DATA = data.quizzes[quizIndex].questions.map((q, i) => ({
//             id: i + 1,
//             text: q.question,
//             options: q.options,
//             correct: q.correct,
//             explanation: q.explanation,
//             user_answer: null // empty until user picks
//         }));

//         loadQuestion(1);
//         renderNavigationCircles();
//     } catch (err) {
//         console.error("Failed to load quiz:", err);
//     }
// }

async function loadUserQuizzes() {
    const userId = new URLSearchParams(window.location.search).get("userId");
    if (!userId) return;

    try {
        const res = await fetch(`http://localhost:5000/quiz/${userId}/my-quizzes`);
        const data = await res.json();

        const container = document.querySelector(".practice-grid");
        container.innerHTML = ""; // remove static buttons

        data.quizzes.forEach((quiz, index) => {
            const btn = document.createElement("button");
            btn.className = "practice-card practice-start-button";
            btn.dataset.quizIndex = index;
            btn.textContent = `QUIZ #${index + 1}`;

            btn.addEventListener("click", () => {
                window.location.href = `quiz_page.html?id=${userId}&quiz=${index}`;
            });

            container.appendChild(btn);
        });

    } catch (err) {
        console.error("Failed to load quizzes:", err);
    }
}

async function loadSelectedQuiz() {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get("userId");
    const quizIndex = urlParams.get("quiz");

    if (!userId || quizIndex === null) return;

    try {
        const res = await fetch(`http://localhost:5000/quiz/${userId}/my-quizzes`);
        const data = await res.json();

        const quizData = data.quizzes[quizIndex];
        if (!quizData) return console.error("Quiz not found");

        QUIZ_DATA = quizData.questions.map((q, i) => ({
            id: i + 1,
            text: q.question,
            options: q.options,
            correct: q.correct,
            explanation: q.explanation,
            user_answer: null
        }));

        loadQuestion(1);
        renderNavigationCircles();
    } catch (err) {
        console.error("Failed to load quiz:", err);
    }
}



checkCompletion();

