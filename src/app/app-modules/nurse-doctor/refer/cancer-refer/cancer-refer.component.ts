/*
 * AMRIT – Accessible Medical Records via Integrated Technology
 * Integrated EHR (Electronic Health Records) Solution
 *
 * Copyright (C) "Piramal Swasthya Management and Research Institute"
 *
 * This file is part of AMRIT.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see https://www.gnu.org/licenses/.
 */

import { Component, OnInit, Input, DoCheck, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SetLanguageComponent } from 'src/app/app-modules/core/component/set-language.component';
import { DoctorService } from 'src/app/app-modules/core/services/doctor.service';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { MasterdataService } from 'src/app/app-modules/core/services/masterdata.service';

@Component({
  selector: 'app-cancer-refer',
  templateUrl: './cancer-refer.component.html',
  styleUrls: ['./cancer-refer.component.css'],
})
export class CancerReferComponent implements OnInit, DoCheck, OnDestroy {
  @Input()
  referForm!: FormGroup;

  @Input()
  referMode!: string;

  revisitDate: any;
  tomorrow: any;
  maxSchedulerDate: any;
  today: any;
  higherHealthcareCenter: any;
  additionalServices: any;
  referralReason: any;
  selectValue: any;
  currentLanguageSet: any;

  constructor(
    private doctorService: DoctorService,
    private masterdataService: MasterdataService,
    private httpServices: HttpServiceService,
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    this.getDoctorMasterData();
    this.today = new Date();
    const d = new Date();
    const checkdate = new Date();
    d.setDate(d.getDate() + 1);
    checkdate.setMonth(this.today.getMonth() + 3);
    this.maxSchedulerDate = checkdate;
    this.tomorrow = d;
  }
  /*
   * JA354063 - Multilingual Changes added on 13/10/21
   */
  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServices);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }
  // Ends
  ngOnDestroy() {
    if (this.doctorMasterDataSubscription)
      this.doctorMasterDataSubscription.unsubscribe();
    if (this.referSubscription) this.referSubscription.unsubscribe();
  }

  doctorMasterDataSubscription: any;
  getDoctorMasterData() {
    this.doctorMasterDataSubscription =
      this.masterdataService.doctorMasterData$.subscribe((masterData) => {
        if (masterData) {
          this.higherHealthcareCenter = masterData.higherHealthCare;
          this.additionalServices = masterData.additionalServices;
          this.referralReason = masterData.referralReason;
          console.log(masterData.revisitDate);
          console.log('hi');
          this.revisitDate = masterData.revisitDate;

          if (this.referMode === 'view') {
            const beneficiaryRegID = localStorage.getItem('beneficiaryRegID');
            const visitID = localStorage.getItem('visitID');
            const visitCategory = localStorage.getItem('visitCategory');
            if (localStorage.getItem('doctorFlag') === '9') {
              this.getReferDetails(beneficiaryRegID, visitID, visitCategory);
            }
          }
        }
      });
  }

  referSubscription: any;
  getReferDetails(beneficiaryRegID: any, visitID: any, visitCategory: any) {
    this.referSubscription = this.doctorService
      .getCaseRecordAndReferDetails(beneficiaryRegID, visitID, visitCategory)
      .subscribe((res: any) => {
        if (res && res.statusCode === 200 && res.data && res.data.diagnosis) {
          console.log('referdetails', res.data.diagnosis);

          this.patchReferDetails(res.data.diagnosis);
        }
      });
  }
  previousServiceList = [];
  patchReferDetails(referDetails: any) {
    this.revisitDate = referDetails.revisitDate;
    this.referralReason = referDetails.referralReason;
    const temp: any = [];
    if (referDetails.refrredToAdditionalServiceList) {
      this.previousServiceList = referDetails.refrredToAdditionalServiceList;
      referDetails.refrredToAdditionalServiceList.map((item: any) => {
        const arr = this.additionalServices.filter((element: any) => {
          if (element.serviceName === item) {
            temp.push(element.serviceName);
            return true;
          } else {
            return false;
          }
        });
      });
    }
    referDetails.refrredToAdditionalServiceList = temp.slice();

    console.log('referDetails', referDetails);
    const referedToInstitute = this.higherHealthcareCenter.filter(
      (item: any) => {
        return item.institutionID === referDetails.referredToInstituteID;
      },
    )[0];
    if (referedToInstitute)
      referDetails.referredToInstituteID = referedToInstitute.institutionID;
    referDetails.revisitDate = this.revisitDate;
    console.log('referredDet=' + referDetails);
    referDetails.referralReason = this.referralReason;
    this.referForm.patchValue({ referralReason: referDetails.referralReason });
    this.referForm.patchValue(referDetails);
  }
  get RevisitDate() {
    return this.referForm.get('revisitDate');
  }
  get ReferralReason() {
    return this.referForm.get('referralReason');
  }

  checkdate(revisitDate: any) {
    this.today = new Date();
    const d = new Date();
    const checkdate = new Date();
    d.setDate(d.getDate() + 1);
    checkdate.setMonth(this.today.getMonth() + 3);
    this.maxSchedulerDate = checkdate;
    this.tomorrow = d;
  }

  canDisable(service: any) {
    if (this.previousServiceList) {
      const temp = this.previousServiceList.filter((item: any) => {
        return item === service.serviceName;
      });

      if (temp.length > 0) {
        service.disabled = true;
        return true;
      } else {
        service.disabled = false;
        return false;
      }
    } else {
      // If previousServiceList is falsy, return false or any other default value
      return false;
    }
  }

  public additionalservices(selected: any): void {
    if (selected !== undefined && selected !== null)
      this.selectValue = selected.length;
    // should display the selected option.
  }

  public higherhealthcarecenter(selected: any): void {
    this.selectValue = selected;
    // should display the selected option.
  }
}
