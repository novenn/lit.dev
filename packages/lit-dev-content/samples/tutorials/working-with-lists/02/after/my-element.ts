import {LitElement, html} from 'lit';
import {customElement, property} from 'lit/decorators.js';

@customElement('my-element')
class MyElement extends LitElement {
  @property({attribute: false})
  names = ['Chandler', 'Phoebe', 'Joey', 'Monica', 'Rachel', 'Ross'];

  render() {
    return html`
      <p>A list of names that include the letter "e"</p>
      <ul>
      ${this.names
        .filter((name) => name.match(/e/i))
        .map((name) => html`<li>${name}</li>`)}
      </ul>
    `;
  }
}
