import { trigger, transition, style, query, animateChild, group, animate, sequence, stagger, state } from '@angular/animations';

export const slideInOut =
    trigger('slideInOut', [
        state('open', style({
            opacity: '1.0',
            transform: 'scale(1)'
        })),
        state('close', style({
            opacity: '0.0',
            transform: 'scale(0.8)'
        })),
        transition('close => open', [
            style({
                opacity: '0.0',
                transform: 'scale(0.8)'
            }),
            animate('0.1s 0s ease-in', style({
                opacity: '1',
                transform: 'scale(1)'
            }))
        ]),
        transition('open => close', [
            style({
                opacity: '1.0',
                transform: 'scale(1)'
            }),
            animate('0.1s 0s ease-in', style({
                opacity: '0.0',
                transform: 'scale(0.8)'
            }))
        ])
    ]);