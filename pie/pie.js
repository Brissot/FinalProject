/**
   A Web Component that creates a pie chart. Currently rudementary, but it will
   get better, I swear!
 */
class Pie extends HTMLElement {
    constructor() {
        super();

	// create a div, but disregard the inner text
        const shadowRoot = this.attachShadow({mode: 'open'});
        const innerDiv = shadowRoot.appendChild(divElem);
    }
}

customElements.define("pie-chart", Pie);
