let surveyData = [];
let spiritualGifts = [];
let giftDefinitions = {};
let currentQuestion = 0;
let userRatings = [];
let surveySubmitted = false;

// DOM elements
const questionElement = document.getElementById('question');
const ratingOptionsElement = document.getElementById('rating-options');
const nextBtn = document.getElementById('next-btn');
const prevBtn = document.getElementById('prev-btn');
const submitBtn = document.getElementById('submit-btn');
const questionCounter = document.getElementById('question-counter');
const progressFill = document.getElementById('progress-fill');
const questionNav = document.getElementById('question-nav');
const surveySection = document.getElementById('survey-section');
const resultsSection = document.getElementById('results-section');
const giftsRanking = document.getElementById('gifts-ranking');
const restartBtn = document.getElementById('restart-btn');

// Load data and initialize survey
async function loadSurveyData() {
    try {
        const questionsResponse = await fetch('questions.json');
        const data = await questionsResponse.json();
        
        surveyData = data.questions;
        spiritualGifts = data.spiritualGifts;
        giftDefinitions = data.giftDefinitions;
        userRatings = new Array(surveyData.length).fill(null);
        
        initializeSurvey();
    } catch (error) {
        console.error('Error loading survey data:', error);
        alert('Có lỗi khi tải dữ liệu khảo sát. Vui lòng thử lại.');
    }
}

function initializeSurvey() {
    // Create question navigation buttons
    questionNav.innerHTML = '';
    for (let i = 0; i < surveyData.length; i++) {
        const btn = document.createElement('div');
        btn.className = 'question-nav-btn';
        btn.textContent = i + 1;
        btn.addEventListener('click', () => goToQuestion(i));
        questionNav.appendChild(btn);
    }
    
    loadQuestion();
}

function loadQuestion() {
    const question = surveyData[currentQuestion];
    questionElement.textContent = question;
    questionCounter.textContent = `Câu hỏi ${currentQuestion + 1} của ${surveyData.length}`;
    
    // Update progress bar based on answered questions
    const answeredCount = userRatings.filter(rating => rating !== null).length;
    const progress = (answeredCount / surveyData.length) * 100;
    progressFill.style.width = progress + '%';
    
    // Update rating options selection
    const ratingOptions = document.querySelectorAll('.rating-option');
    ratingOptions.forEach(option => {
        option.classList.remove('selected');
        if (userRatings[currentQuestion] !== null && 
            parseInt(option.dataset.rating) === userRatings[currentQuestion]) {
            option.classList.add('selected');
        }
    });
    
    // Update navigation buttons
    updateNavigationButtons();
    updateQuestionNavigation();
}

function selectRating(rating) {
    if (surveySubmitted) return;
    
    userRatings[currentQuestion] = rating;
    
    // Remove previous selections
    document.querySelectorAll('.rating-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // Mark selected option
    document.querySelector(`[data-rating="${rating}"]`).classList.add('selected');
    
    updateNavigationButtons();
    updateQuestionNavigation();
}

function updateNavigationButtons() {
    // Previous button
    prevBtn.disabled = currentQuestion === 0;
    
    // Next and submit buttons
    const isLastQuestion = currentQuestion === surveyData.length - 1;
    
    if (isLastQuestion) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'inline-block';
    } else {
        nextBtn.style.display = 'inline-block';
        submitBtn.style.display = 'none';
        nextBtn.disabled = false;
    }
}

function updateQuestionNavigation() {
    const navButtons = document.querySelectorAll('.question-nav-btn');
    navButtons.forEach((btn, index) => {
        btn.classList.remove('current', 'answered');
        
        if (index === currentQuestion) {
            btn.classList.add('current');
        }
        
        if (userRatings[index] !== null) {
            btn.classList.add('answered');
            if (index === currentQuestion) {
                btn.classList.add('current');
            }
        }
    });
}

function goToQuestion(questionIndex) {
    if (surveySubmitted) return;
    currentQuestion = questionIndex;
    loadQuestion();
}

function nextQuestion() {
    if (currentQuestion < surveyData.length - 1) {
        currentQuestion++;
        loadQuestion();
    }
}

function prevQuestion() {
    if (currentQuestion > 0) {
        currentQuestion--;
        loadQuestion();
    }
}

function calculateGiftScores() {
    const giftScores = [];
    
    // Calculate scores for each spiritual gift
    spiritualGifts.forEach((gift, giftIndex) => {
        let totalScore = 0;
        
        // Each gift has 5 questions: starting at giftIndex+1, then +25 for each subsequent question
        for (let i = 0; i < 5; i++) {
            const questionIndex = giftIndex + (i * 25);
            if (questionIndex < userRatings.length && userRatings[questionIndex] !== null) {
                totalScore += userRatings[questionIndex];
            }
        }
        
        giftScores.push({
            name: gift,
            score: totalScore,
            maxScore: 15, // 5 questions × 3 max points each
            percentage: Math.round((totalScore / 15) * 100)
        });
    });
    
    // Sort by score (highest to lowest)
    return giftScores.sort((a, b) => b.score - a.score);
}

function submitSurvey() {
    // Check if all questions are answered
    const unansweredQuestions = userRatings.map((rating, index) => rating === null ? index + 1 : null)
        .filter(q => q !== null);
    
    if (unansweredQuestions.length > 0) {
        alert(`Vui lòng trả lời tất cả các câu hỏi trước khi hoàn thành. Các câu chưa trả lời: ${unansweredQuestions.slice(0, 10).join(', ')}${unansweredQuestions.length > 10 ? '...' : ''}`);
        return;
    }
    
    surveySubmitted = true;
    showResults();
}


function showResults() {
    surveySection.classList.add('hidden');
    resultsSection.classList.add('show');
    
    const giftScores = calculateGiftScores();
    displayResults(giftScores);
}

function displayResults(giftScores) {
    giftsRanking.innerHTML = '';
    
    giftScores.forEach((gift, index) => {
        const giftItem = document.createElement('div');
        giftItem.className = 'gift-item';
        
        // Add classification classes based on score
        if (gift.score >= 12) {
            giftItem.classList.add('top-gift');
        } else if (gift.score >= 9) {
            giftItem.classList.add('high-gift');
        } else if (gift.score >= 6) {
            giftItem.classList.add('medium-gift');
        } else {
            giftItem.classList.add('low-gift');
        }
        
        const definition = giftDefinitions[gift.name] || 'Định nghĩa không có sẵn';
        
        giftItem.innerHTML = `
            <div>
                <div class="gift-name">
                    ${index + 1}. ${gift.name}
                </div>
                <div class="expanded-content">
                    ${definition}
                </div>
            </div>
            <div style="display: flex; align-items: center;">
                <span class="gift-score ${gift.score >= 12 ? 'high-score' : gift.score >= 6 ? 'medium-score' : 'low-score'}">${gift.score}/15</span>
                <span class="gift-percentage">(${gift.percentage}%)</span>
            </div>
        `;
        
        giftsRanking.appendChild(giftItem);
        
        // Add click event listener for expanded content
        giftItem.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Close all other expanded items
            document.querySelectorAll('.gift-item').forEach(item => {
                if (item !== giftItem) {
                    item.classList.remove('active');
                }
            });
            
            // Toggle current expanded content
            giftItem.classList.toggle('active');
        });
    });
}

function restartSurvey() {
    currentQuestion = 0;
    userRatings = new Array(surveyData.length).fill(null);
    surveySubmitted = false;
    
    surveySection.classList.remove('hidden');
    resultsSection.classList.remove('show');
    
    loadQuestion();
}

// Event listeners
document.querySelectorAll('.rating-option').forEach(option => {
    option.addEventListener('click', (e) => {
        const rating = parseInt(e.currentTarget.dataset.rating);
        selectRating(rating);
    });
});

nextBtn.addEventListener('click', nextQuestion);
prevBtn.addEventListener('click', prevQuestion);
submitBtn.addEventListener('click', submitSurvey);
restartBtn.addEventListener('click', restartSurvey);

// Close expanded content when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.gift-item')) {
        document.querySelectorAll('.gift-item').forEach(item => {
            item.classList.remove('active');
        });
    }
});

// Initialize survey when page loads
document.addEventListener('DOMContentLoaded', loadSurveyData);
