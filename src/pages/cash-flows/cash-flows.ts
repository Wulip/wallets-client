import {Component, OnInit} from '@angular/core';

import { Alert, AlertController, Modal, ModalController, NavController, NavParams } from 'ionic-angular';

import { Wallet } from '../../models/wallet/wallet';
import { CashFlow } from '../../models/cash-flow/cash-flow';

import { AddCashFlowPage } from '../add-cash-flow/add-cash-flow'

import { CashFlowService } from '../../services/cash-flow/cash-flow.service';
import { WalletService } from '../../services/wallet/wallet.service';

@Component({
    selector: 'page-cash-flows',
    templateUrl: 'cash-flows.html'
})

export class CashFlowsPage implements OnInit {
    public cashFlows:CashFlow[];
    public wallet:Wallet;

    constructor(private cashFlowService:CashFlowService, private walletService:WalletService,
                private navController:NavController, private navParams:NavParams,
                private alertController:AlertController, private modalController:ModalController){}

    ngOnInit () {
        this.getWallet();
        this.getCashFlows();
    }

    getCashFlows () {
        this.cashFlowService.getCashFlows(this.wallet.id)
            .subscribe((cashFlows:CashFlow[]) => {this.cashFlows = cashFlows});
    }

    getWallet () {
        this.wallet=this.navParams.get('wallet');
    }

    addCashFlow () {
        let modal:Modal = this.modalController.create(AddCashFlowPage, {wallet: this.wallet});
        modal.present();
        modal.onDidDismiss((data:{wallet:Wallet, cashFlow:CashFlow}) => {
            this.wallet = data.wallet;
            this.cashFlows.push(data.cashFlow);
        })
    }

    deleteCashFlow (index:number) {
        let confirm:Alert = this.alertController.create({
            title: 'Bevétel/Kiadás Törlése',
            message: 'Biztos hogy törlöni akarod ezt a bevételt/kiadást?',
            buttons:[
                {
                    'text': 'Mégse',
                    'role': 'cancel'
                },
                {
                    'text': 'Törlés',
                    'handler': () => {
                        this.cashFlowService.deleteCashFlow(this.cashFlows[index].id)
                            .subscribe(() => {
                                let wallet = Object.assign({}, this.wallet);
                                wallet.amount = this.cashFlows[index].amount * -1;
                                this.walletService.modifyWallet(wallet)
                                    .subscribe((wallet:Wallet) => this.wallet = wallet );
                                this.cashFlows.splice(index, 1)
                        });
                    }
                }
            ]
        })
        confirm.present();
    }
    modifyCashFlow (index:number) {
        let prompt:Alert = this.alertController.create();
        prompt.setTitle('Bevétel/Kiadás módosítása');
        prompt.setMessage('Írd be abevétel/kiadás új adatait');
        prompt.addInput({
            name: 'text',
            placeholder: 'Szöveg',
            value: this.cashFlows[index].text
        });
        prompt.addInput({
            type: 'number',
            name: 'amount',
            placeholder: 'Összeg',
            value: this.cashFlows[index].amount.toString()
        })
        prompt.addButton({
            role: 'cancel',
            text: 'Mégse'
        })
        prompt.addButton({
            text: 'Módosítás',
            handler: (cashFlow:CashFlow) => {
                cashFlow.id = this.cashFlows[index].id;
                this.cashFlowService.modifyCashFlow(cashFlow)
                    .subscribe((cashFlow:CashFlow) => {
                        let wallet:Wallet = Object.assign({}, this.wallet);
                        wallet.amount = (this.cashFlows[index].amount - cashFlow.amount) * -1;
                        this.cashFlows[index] = cashFlow;
                        this.walletService.modifyWallet(wallet)
                            .subscribe((wallet:Wallet) => this.wallet = wallet );
                    })
            }
        })

        prompt.present();
    }
}
