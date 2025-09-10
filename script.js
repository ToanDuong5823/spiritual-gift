let surveyData = [];
let spiritualGifts = [];
let giftDefinitions = {};
let currentQuestion = 0;
let userRatings = [];
let surveySubmitted = false;
let testHistory = [];

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
const historySection = document.getElementById('history-section');
const historyList = document.getElementById('history-list');
const viewHistoryBtn = document.getElementById('view-history-btn');
const backToResultsBtn = document.getElementById('back-to-results-btn');
const clearHistoryBtn = document.getElementById('clear-history-btn');
const viewHistoryMainBtn = document.getElementById('view-history-main-btn');

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
    
    // Auto-save current progress
    saveCurrentProgress();
    
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
    
    // Automatically save results when survey is completed
    autoSaveResults();
    
    showResults();
}


function showResults() {
    surveySection.classList.add('hidden');
    resultsSection.classList.add('show');
    historySection.classList.remove('show');
    
    const giftScores = calculateGiftScores();
    displayResults(giftScores);
}

// History management functions
function saveCurrentProgress() {
    // Save current progress to localStorage
    const progressData = {
        userRatings: [...userRatings],
        currentQuestion: currentQuestion,
        lastSaved: new Date().toISOString()
    };
    localStorage.setItem('spiritualGiftsProgress', JSON.stringify(progressData));
}

function loadCurrentProgress() {
    const savedProgress = localStorage.getItem('spiritualGiftsProgress');
    if (savedProgress) {
        try {
            const progressData = JSON.parse(savedProgress);
            userRatings = progressData.userRatings || new Array(surveyData.length).fill(null);
            currentQuestion = progressData.currentQuestion || 0;
            
            // If there's saved progress, show a restore option
            if (userRatings.some(rating => rating !== null)) {
                showRestoreOption();
            }
        } catch (error) {
            console.error('Error loading progress:', error);
        }
    }
}

function showRestoreOption() {
    const answeredCount = userRatings.filter(rating => rating !== null).length;
    if (answeredCount > 0) {
        const restoreDiv = document.createElement('div');
        restoreDiv.className = 'restore-option';
        restoreDiv.innerHTML = `
            <div style="background: var(--verse-bg); padding: 20px; border-radius: 15px; margin-bottom: 20px; border-left: 4px solid var(--accent-color);">
                <h3 style="margin-bottom: 10px; color: var(--text-color);">📋 Có tiến trình đã lưu</h3>
                <p style="color: var(--secondary-text); margin-bottom: 15px;">
                    Bạn có ${answeredCount} câu hỏi đã trả lời từ phiên trước. Bạn có muốn tiếp tục?
                </p>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button class="btn btn-success" id="restore-progress-btn">Tiếp tục (${answeredCount} câu)</button>
                    <button class="btn btn-secondary" id="start-fresh-btn">Bắt đầu mới</button>
                </div>
            </div>
        `;
        
        const surveyHeader = document.querySelector('.survey-header');
        surveyHeader.appendChild(restoreDiv);
        
        // Add event listeners
        document.getElementById('restore-progress-btn').addEventListener('click', () => {
            restoreDiv.remove();
            loadQuestion();
            updateQuestionNavigation();
            updateProgressBar();
            updateNavigationButtons();
        });
        
        document.getElementById('start-fresh-btn').addEventListener('click', () => {
            userRatings = new Array(surveyData.length).fill(null);
            currentQuestion = 0;
            restoreDiv.remove();
            loadQuestion();
            updateQuestionNavigation();
            updateProgressBar();
            updateNavigationButtons();
        });
    }
}

function autoSaveResults() {
    const giftScores = calculateGiftScores();
    const historyItem = {
        id: Date.now(),
        date: new Date().toLocaleString('vi-VN'),
        giftScores: giftScores,
        userRatings: [...userRatings]
    };
    
    testHistory.unshift(historyItem); // Add to beginning of array
    
    // Limit to maximum 10 history items
    if (testHistory.length > 10) {
        testHistory = testHistory.slice(0, 10);
    }
    
    localStorage.setItem('spiritualGiftsHistory', JSON.stringify(testHistory));
    
    // Clear progress after saving final results
    localStorage.removeItem('spiritualGiftsProgress');
    
    // Show auto-save notification
    showAutoSaveNotification();
}

function showAutoSaveNotification() {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 1000;
        font-weight: 600;
        animation: slideIn 0.3s ease;
    `;
    notification.innerHTML = '✓ Kết quả đã được tự động lưu!';
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Keep the old function for backward compatibility (in case it's called elsewhere)
function saveCurrentResults() {
    autoSaveResults();
}

function loadHistory() {
    const savedHistory = localStorage.getItem('spiritualGiftsHistory');
    if (savedHistory) {
        testHistory = JSON.parse(savedHistory);
        
        // Clean up if history exceeds 10 items
        if (testHistory.length > 10) {
            testHistory = testHistory.slice(0, 10);
            localStorage.setItem('spiritualGiftsHistory', JSON.stringify(testHistory));
        }
    }
}

function showHistory() {
    resultsSection.classList.remove('show');
    historySection.classList.add('show');
    displayHistory();
}

function hideHistory() {
    historySection.classList.remove('show');
    
    // Check if we have completed results or are in the middle of survey
    const hasCompletedResults = userRatings.every(rating => rating !== null);
    
    if (hasCompletedResults) {
        resultsSection.classList.add('show');
    } else {
        surveySection.classList.remove('hidden');
    }
}

function displayHistory() {
    historyList.innerHTML = '';
    
    if (testHistory.length === 0) {
        historyList.innerHTML = '<p style="text-align: center; color: var(--secondary-text); padding: 40px;">Chưa có lịch sử khảo sát nào.</p>';
        return;
    }
    
    // Add history count indicator
    const countIndicator = document.createElement('div');
    countIndicator.style.cssText = 'text-align: center; color: var(--secondary-text); margin-bottom: 20px; font-size: 0.9rem;';
    countIndicator.textContent = `Hiển thị ${testHistory.length}/10 kết quả gần nhất`;
    historyList.appendChild(countIndicator);
    
    testHistory.forEach((item, index) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        // Get top 5 gifts
        const topGifts = item.giftScores.slice(0, 5);
        const totalScore = item.giftScores.reduce((sum, gift) => sum + gift.score, 0);
        
        historyItem.innerHTML = `
            <div class="history-item-header">
                <div class="history-item-date">${item.date}</div>
                <div class="history-item-score">Tổng điểm: ${totalScore}/375</div>
            </div>
            <div class="history-item-gifts">
                ${topGifts.map((gift, giftIndex) => {
                    let className = 'history-gift-tag';
                    if (gift.score >= 12) className += ' top-gift';
                    else if (gift.score >= 9) className += ' high-gift';
                    else if (gift.score >= 6) className += ' medium-gift';
                    else className += ' low-gift';
                    
                    return `<span class="${className}">${giftIndex + 1}. ${gift.name} (${gift.score}/15)</span>`;
                }).join('')}
            </div>
        `;
        
        // Add click event to view detailed results
        historyItem.addEventListener('click', () => {
            viewHistoryItem(item);
        });
        
        historyList.appendChild(historyItem);
    });
}

function viewHistoryItem(historyItem) {
    // Temporarily store current results
    const currentGiftScores = calculateGiftScores();
    const currentRatings = [...userRatings];
    
    // Load history item data
    userRatings = [...historyItem.userRatings];
    const giftScores = historyItem.giftScores;
    
    // Show results
    displayResults(giftScores);
    hideHistory();
    
    // Add a back button to restore original results
    const backBtn = document.createElement('button');
    backBtn.className = 'btn btn-secondary';
    backBtn.textContent = '← Quay lại kết quả hiện tại';
    backBtn.style.marginTop = '20px';
    
    backBtn.addEventListener('click', () => {
        userRatings = currentRatings;
        displayResults(currentGiftScores);
        backBtn.remove();
    });
    
    const resultsActions = document.querySelector('.results-actions');
    resultsActions.appendChild(backBtn);
}

function clearHistory() {
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử khảo sát? (Tối đa 10 kết quả được lưu)')) {
        testHistory = [];
        localStorage.removeItem('spiritualGiftsHistory');
        displayHistory();
    }
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
            <div class="gift-content">
                <div class="gift-name">
                    ${index + 1}. ${gift.name}
                </div>
                <div class="expanded-content">
                    ${definition}
                </div>
            </div>
            <div class="gift-score-section">
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

// Theme management functions
function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');

    function applyTheme(isDark) {
        if (isDark) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }

    function detectSystemTheme() {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyTheme(prefersDark);
        // Store preference
        localStorage.setItem('theme', prefersDark ? 'dark' : 'light');
    }

    // Load saved theme or detect system theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        applyTheme(savedTheme === 'dark');
    } else {
        detectSystemTheme();
    }

    // Listen for system theme changes
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                applyTheme(e.matches);
            }
        });
    }

    // Manual theme toggle button
    themeToggle.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark-mode');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });


    // History button functionality
    if (viewHistoryBtn) {
        viewHistoryBtn.addEventListener('click', showHistory);
    }
    
    if (backToResultsBtn) {
        backToResultsBtn.addEventListener('click', hideHistory);
    }
    
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', clearHistory);
    }
    
    if (viewHistoryMainBtn) {
        viewHistoryMainBtn.addEventListener('click', () => {
            surveySection.classList.add('hidden');
            resultsSection.classList.remove('show');
            historySection.classList.add('show');
            displayHistory();
        });
    }
}

// Initialize survey when page loads
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadHistory();
    loadSurveyData().then(() => {
        loadCurrentProgress();
    });
});
