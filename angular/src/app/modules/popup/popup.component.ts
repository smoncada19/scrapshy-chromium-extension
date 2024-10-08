import { Component, Inject, signal } from '@angular/core'
import { TAB_ID } from 'src/app/app.config'
import { Scrapshy } from 'src/app/services/scrap.service';
import { HomeComponent } from 'src/app/pages/home/home.component';


@Component({
  selector: 'app-popup',
  standalone: true,
  imports: [HomeComponent],
  templateUrl: 'popup.component.html',
  styleUrls: ['popup.component.scss'],
  providers: [Scrapshy]
})
export class PopupComponent {
  message = signal('')
  scrapper = signal('');

  constructor(
    @Inject(TAB_ID) readonly tabId: number,
    private sc: Scrapshy
  ) {}

  onClick() {
    chrome.scripting.executeScript(
      {
        target: { tabId: this.tabId },
        func: () => {
          return this.sc.scrap(this.tabId);
        }
      },
      (results) => {
        // Los resultados de la función inyectada se devuelven aquí
        if (results && results[0]) {
          console.log('Resultado del script:', results[0].result);
          //this.message.set(results[0].result); // Actualiza la señal con el resultado
        }
      }
    );

  }
}