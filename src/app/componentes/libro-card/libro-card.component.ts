import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Libro } from '../../modelos/modelos';

@Component({
  selector: 'app-libro-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './libro-card.component.html',
  styleUrl: './libro-card.component.css'
})
export class LibroCardComponent {
  @Input({ required: true }) libro!: Libro;
  @Input() repisa = false;
}
