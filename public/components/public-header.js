const public_header_template = document.createElement("template");
public_header_template.innerHTML = `
    <header class="nav-start">
      <a href="index.html" class="logo">
        <svg class="logo" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="303 440 496 225" style="enable-background:new 0 0 1080 1080;" xml:space="preserve">
          <g>
            <polygon points="306.24,508.83 306.24,625.38 428.17,612.83 428.17,569.79 351.96,578.76 354.65,457.72 345.26,457.72 "/>
            <polygon points="417.34,494.64 471.25,609.28 450.18,662.57 496.66,658.85 564.21,472.95 516.49,478.52 493.56,549.79 466.29,486.58 	"/>
            <path d="M577.22,471.09v125.8l45.24-4.34l-1.24-69.41c0,0,13.63-16.73,38.35-16.73v-47.85c0,0-24.19,3.15-37.33,19.98v-12.62L577.22,471.09z"/>
            <path d="M675.34,459.54v124.14c0,1.41,1.23,2.51,2.63,2.34l40.5-4.71c1.19-0.14,2.09-1.15,2.09-2.34v-76.8
              c0-0.34,0.18-0.64,0.21-0.98c0.27-2.93,7.07-13.36,21.72-10.05c0.11,0.02,0.2,0.03,0.31,0.05c1.21,0.27,8.78,2.38,8.78,12.06
              l0.51,72.12c0.01,1.37,1.18,2.45,2.55,2.34l40.52-3.3c1.23-0.1,2.17-1.12,2.17-2.35v-84.58c0-18.63-11.12-38.81-30.05-43.75
              c-14.4-3.76-32.48-0.04-42.64,11.23c-1.43,1.59-4.07,0.53-4.07-1.61l0,0c0-1.45-1.29-2.55-2.72-2.33l-40.5,6.19
              C676.19,457.38,675.34,458.37,675.34,459.54z"/>
          </g>
        </svg>
      </a>
      <label for="nav-toggle" class="nav-toggle-label">
        <span></span>
      </label>
      <input type="checkbox" id="nav-toggle" class="nav-toggle">
      <nav>
        <ul>
          <li><a href="free-test-taker.html">Free Practice</a></li>
          <li><a href="why.html">Why Lyrn</a></li>
          <li><a href="pricing.html">Pricing</a></li>
          <li><div class="phone"><a href="sign-in.html">Sign in</a></div></li>
        </ul>
      </nav>
    </header>
`

class PublicHeader extends HTMLElement {
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: "open" });
        const styles = document.createElement('link');
        styles.rel = "stylesheet";
        styles.href = "/components/public-header.css"

        shadow.append(styles);
        shadow.append(public_header_template.content.cloneNode(true))
    }
}

customElements.define("public-header", PublicHeader);