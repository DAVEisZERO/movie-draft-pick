import { Component, OnInit } from '@angular/core';
import { Review } from '../../classes/review';
import {
    IonHeader,
    IonContent,
    IonRow,
    IonCol,
    IonIcon,
    IonToolbar,
    IonTitle,
    IonGrid,
    IonList,
    IonInput,
    IonButtons,
    IonButton,
    IonAlert,
    ModalController,
    InputCustomEvent,
} from '@ionic/angular/standalone';
import { NgStyle } from '@angular/common';
import { json2csv } from 'json-2-csv';
import { FormBuilder, FormArray, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
    selector: 'app-review-scoring',
    templateUrl: './review-scoring.component.html',
    styleUrls: ['./review-scoring.component.scss'],
    standalone: true,
    imports: [
        IonAlert,
        IonButton,
        IonButtons,
        IonInput,
        IonList,
        IonGrid,
        IonTitle,
        IonToolbar,
        IonIcon,
        IonCol,
        IonRow,
        IonHeader,
        IonContent,
        NgStyle,
        ReactiveFormsModule,
    ],
})
export class ReviewScoringComponent implements OnInit {
    review!: Review;
    reviewForm!: FormGroup;
    placeholders: string[];
    alertTitle?: string;
    alertMessage?: string;

    get scoresControl() {
        return this.reviewForm.get('scores') as FormArray;
    }

    constructor(
        private formBuilder: FormBuilder,
        private modalCtrl: ModalController,
    ) {
        this.placeholders = [];
    }

    ngOnInit(): void {
        if (!this.review) throw new Error('No review provided');
        this.reviewForm = this.formBuilder.group({
            scores: this.formBuilder.array(
                this.review.reviewers.map((reviewer) =>
                    this.formBuilder.control(reviewer.score, [
                        Validators.required,
                        Validators.min(0),
                        Validators.max(5),
                    ]),
                ),
            ),
        });
        const map = new Map<string, string>([
            ['alejo', '"Me voy enojado a dormir" (2.5)'],
            ['dave', '"Vaya puta mierda tío "(3.69)'],
            ['tobi', '"Hubo rock" (5)'],
            ['mathias', '"Kino" (4.5)'],
            ['vinicio', '"Zzzzz" (3)'],
            ['guille', '"Bueno, no está tan mal" (4.9)'],
            ['darek', '"Es un peliculón" (6 estreshas)'],
            ['fausto', '"Excelentísima película" (1)'],
            ['daniel', '"A mí sí me gustó" (4.20)'],
            ['isa', '"Por lo menos no vimos The Hateful Eight" (4)'],
        ]);
        const defaultPlaceholder = 'Nunca más vengo a esto (???)';
        this.review.reviewers.forEach((reviewer) => {
            const reviewerName = reviewer.name.toLowerCase().trim();
            const foundPlaceholder = map.get(reviewerName);
            if (!foundPlaceholder) {
                this.placeholders.push(defaultPlaceholder);
                return;
            }
            this.placeholders.push(foundPlaceholder);
            map.delete(reviewerName);
        });
    }

    changeScore(index: number, event: InputCustomEvent): void {
        const scoreString = event.detail.value;
        const reviewer = this.review.reviewers[index];
        if (!scoreString) {
            this.review.removeScore(reviewer);
        } else {
            const score = parseFloat(scoreString);
            this.review.addOrReplaceScore(reviewer, score);
        }
    }

    exportListData(): void {
        this.alertTitle = `Final score: ${this.review.finish()}`;
        this.alertMessage = `${this.review.film.title} (${this.review.film.year}) receives ${this.review.finish()}/5 stars!`;
        const timestamp = new Date().toJSON().slice(0, 10);
        const filename = `review-export-${this.review.film.title}-${this.review.film.year}-${timestamp}.csv`;
        const csv = json2csv(
            this.review.reviewers.map((reviewer) => {
                return { film: this.review.film.title, ...reviewer };
            }),
            {
                excludeKeys: ['color', 'contrast'],
                unwindArrays: true,
                emptyFieldValue: null,
            },
        );
        this.downloadFile(csv, filename, 'text/csv');
        this.modalCtrl.dismiss();
    }

    async downloadFile(content: string, filename: string, type: string): Promise<void> {
        const file = new Blob([content], { type });
        const tempLink = document.createElement('a');
        tempLink.download = filename;
        tempLink.href = URL.createObjectURL(file);
        tempLink.style.display = 'none';
        document.body.appendChild(tempLink);
        tempLink.click();
        document.body.removeChild(tempLink);
    }
}
