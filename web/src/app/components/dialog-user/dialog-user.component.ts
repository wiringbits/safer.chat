import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatSnackBar, MatSnackBarRef, SimpleSnackBar } from '@angular/material';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ChatService } from 'src/app/services/chat.service';
import { User, Event, Channel } from '../../models';
import { CryptoService } from 'src/app/services/crypto.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-dialog-user',
  templateUrl: './dialog-user.component.html',
  styleUrls: ['./dialog-user.component.css']
})
export class DialogUserComponent {

  constructor(
    public dialogRef: MatDialogRef<DialogUserComponent>,
    @Inject(MAT_DIALOG_DATA)
    public params: any,
  ) {}

  public async logOut() {
    this.dialogRef.close({
      logout: true
    });
  }
}
