import { trigger, transition, style, query, animateChild, group, animate, sequence, stagger } from '@angular/animations';

export const slideInAnimation =
    trigger('routeSlide', [
        transition('* <=> *', [
            
            group([
                query('.main-card', [
                    style({
                        opacity: '0.5',
                        transform: 'scale(1)'
                    }),
                    sequence([
                        animate('0.1s 0s ease-in', style({
                            opacity: '0',
                            transform: 'scale(1.05)'
                        })),
                        animate('0s 0.1s ease-in', style({
                            opacity: '0',
                            transform: 'scale(0.95)'
                        })),
                        animate('0.1s 0.1s ease-in', style({
                            opacity: '1',
                            transform: 'scale(1)'
                       }))
                    ])
                ], { optional: true })
            ]),
        ]),
    ]);