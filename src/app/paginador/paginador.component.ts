import { Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-paginador',
  templateUrl: './paginador.component.html',
  styleUrl: './paginador.component.scss',
})
export class PaginadorComponent {
  currentPage = input.required<number>();
  lastPage    = input.required<number>();
  total       = input<number>(0);

  pageChange = output<number>();

  paginasVisibles = computed((): (number | '...')[] => {
    const current = this.currentPage();
    const last    = this.lastPage();

    if (last <= 1) return [];
    if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);

    const pages: (number | '...')[] = [1];

    if (current > 3) pages.push('...');

    const start = Math.max(2, current - 1);
    const end   = Math.min(last - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    if (current < last - 2) pages.push('...');
    pages.push(last);

    return pages;
  });

  ir(pagina: number | '...') {
    if (pagina === '...' || pagina === this.currentPage()) return;
    this.pageChange.emit(pagina as number);
  }

  anterior() {
    if (this.currentPage() > 1) this.pageChange.emit(this.currentPage() - 1);
  }

  siguiente() {
    if (this.currentPage() < this.lastPage()) this.pageChange.emit(this.currentPage() + 1);
  }
}
