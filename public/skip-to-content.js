document.querySelector('.skip-to-content')?.addEventListener('focus', function() {
  this.style.transform = 'translateY(0)';
  this.style.left = '0';
});
document.querySelector('.skip-to-content')?.addEventListener('blur', function() {
  this.style.transform = 'translateY(-100%)';
  this.style.left = '-9999px';
});
