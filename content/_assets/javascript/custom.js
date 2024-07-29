// Use this file to add custom JavaScript
//
// A number of JavaScript functions and libraries are included with Quire,
// to see which ones, check the files in themes/quire-starter-theme/source/js // and the list of dependencies in themes/quire-starter-theme/package.json

export class CustomBox {
  constructor(

  ) {
  }

  init() {
    console.log('Start Custom js')
    this.addLogoToNavigation();
  }

  addLogoToNavigation() {
    const quireNavbarControlsLeft = document.querySelector('nav .quire-navbar-controls__left');
    quireNavbarControlsLeft?.classList.add('cb-d-flex');
    const buttonSearch = quireNavbarControlsLeft?.querySelector('.quire-navbar-button.search-button');
    //language=html
    const html = `
        <div id="logo-container" class="cb-d-flex ">
            <img src="/_assets/images/logo-accademia-carrara.png" alt="logo Accademia Carrara">
        </div>
    `;

    const logoContainer = document.createElement('div');
    logoContainer.id = 'logo-container';
    logoContainer.classList.add('cb-d-flex');
    quireNavbarControlsLeft.insertBefore(logoContainer, buttonSearch);


    const img = document.createElement('img');
    img.src = '/_assets/images/logo-accademia-carrara.png';
    img.alt = 'logo Accademia Carrara';
    logoContainer.appendChild(img);

  }
}