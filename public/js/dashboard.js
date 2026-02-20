// Dashboard JavaScript
console.log('📊 Dashboard loaded');

// Filter click handlers
const filterItems = document.querySelectorAll('.filter-list li');
filterItems.forEach(item => {
  item.addEventListener('click', function() {
    // Remove active class from all
    filterItems.forEach(i => i.classList.remove('active'));
    // Add active to clicked
    this.classList.add('active');
    
    console.log('Filter changed:', this.textContent.trim());
    // TODO: Will filter PRs when connected to backend
  });
});

// PR card click handlers
const prCards = document.querySelectorAll('.pr-card');
prCards.forEach(card => {
  card.addEventListener('click', function() {
    const prNumber = this.querySelector('.pr-number').textContent;
    console.log('Clicked PR:', prNumber);
    
    // TODO: Will navigate to PR detail page
    alert(`PR ${prNumber} clicked! Detail page coming soon.`);
  });
});

// New PR button
const newPRBtn = document.querySelector('.content-header .btn-primary');
if (newPRBtn) {
  newPRBtn.addEventListener('click', function() {
    console.log('New PR button clicked');
    // TODO: Will open create PR form
    alert('Create PR form coming soon!');
  });
}

// Logout handler
const logoutBtn = document.querySelector('.logout');
if (logoutBtn) {
  logoutBtn.addEventListener('click', function(e) {
    e.preventDefault();
    console.log('Logout clicked');
    
    if (confirm('Are you sure you want to logout?')) {
      // TODO: Clear session/token when backend is ready
      window.location.href = 'index.html';
    }
  });
}
