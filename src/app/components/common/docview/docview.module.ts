import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { DocviewComponent, CommentDialog } from './docview.component';
import { DateAgoPipe } from './dateago.pipe';
import { Draggable } from './draggable.component';
import { AngularResizedEventModule } from 'angular-resize-event';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';

@NgModule({
    declarations: [
        DocviewComponent,
        CommentDialog,
        DateAgoPipe,
        Draggable
    ],
    imports: [
        BrowserModule,
        CommonModule,
        FormsModule,
        BrowserAnimationsModule,
        ReactiveFormsModule,
        HttpClientModule,
        AngularResizedEventModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatDialogModule,
        MatTooltipModule
    ],
    exports: [
        DocviewComponent
    ],
    providers: [],
    entryComponents: [CommentDialog]
})
export class DocViewModule { }
