document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('.item-card, .glass');

  cards.forEach((card, index) => {
    card.style.animationDelay = `${index * 0.08}s`;
  });
});