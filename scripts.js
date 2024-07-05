document.addEventListener("DOMContentLoaded", () => {
    const posts = document.querySelectorAll('.post');
    posts.forEach(post => {
        post.addEventListener('mouseover', () => {
            post.style.backgroundColor = '#00d1b2';
        });
        post.addEventListener('mouseout', () => {
            post.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        });
    });
});
