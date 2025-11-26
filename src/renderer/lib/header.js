// Header module
export function init() {
  const header = document.querySelector('header');
  if (!header) return;

  const links = header.querySelectorAll('a');
  
  links.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Remove active class from all links
      links.forEach(l => l.classList.remove('active'));
      
      // Add active class to clicked link
      link.classList.add('active');
      
      // Hide all sections
      const sections = document.querySelectorAll('body > section');
      sections.forEach(section => {
        section.style.display = 'none';
      });
      
      // Show the section corresponding to the clicked link
      const sectionClass = link.className.split(' ').find(cls => 
        cls !== 'ss-icon' && cls !== 'active'
      );
      
      if (sectionClass) {
        const section = document.querySelector(`section.${sectionClass}`);
        if (section) {
          section.style.display = 'block';
        }
      }
    });
  });
  
  // Show connections section by default
  const connectionsLink = header.querySelector('a.connections');
  if (connectionsLink) {
    connectionsLink.click();
  }
}

