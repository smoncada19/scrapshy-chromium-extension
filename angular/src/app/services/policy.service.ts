import { Injectable, signal, WritableSignal } from "@angular/core";
import { ScrapshyService } from "./scrapshy/scrapshy.service";
import { Policy } from "src/app/models/policy.model";
import { Plan } from "../models/plan.model";
import { Address } from "../models/address.model";
import { Member } from "../models/member.model";
import { Owner } from "../models/owner.model";


@Injectable({
    providedIn: 'root'
})
export class PolicyService {

    private _policy = signal(new Policy());

    get policySignal(): WritableSignal<Policy> {
        return this._policy;
    }

    constructor(private sc: ScrapshyService) {}

    async onClick() {
        await this.sc.get_dom()
        this._policy.set(this.scrapPolicy())
    }

    clean() {
        this._policy.set(new Policy())
    }

    get_owner() {
        const texts = ['ID de FFM', 'FFM ID']
        const textConditions = texts.map((text) => `text()="${text}"`).join(' or ');
        const xpath = `//tr/td[span[${textConditions}]]/following-sibling::td/span`;

        const result = this.sc.evaluate(xpath);
        
        const values: string[] = [];

        for (let i = 0; i < result.snapshotLength; i++) {
            const span = result.snapshotItem(i) as HTMLElement;
            if (span) {
                values.push(span.textContent || '');
            }
        }

        return values;
    }

    get_application(xpath) {
        // XPath para seleccionar todas las filas excepto la fila de encabezado (usamos tbody/tr para excluir th)
        
        const result = this.sc.evaluate(xpath);
    
        // Array para almacenar las filas
        const tableData: string[][] = [];
    
        for (let i = 0; i < result.snapshotLength; i++) {
            const row = result.snapshotItem(i) as HTMLElement;
            if (row) {
                // Extraer todas las celdas de esta fila
                const cells = row.querySelectorAll('td');
                const rowData: string[] = [];
    
                // Iterar sobre las celdas y extraer su contenido
                cells.forEach((cell) => {
                    rowData.push(cell.textContent?.trim() || '');
                });
    
                // Agregar esta fila al array de la tabla
                tableData.push(rowData);
            }
        }
    
        console.log(tableData);
    }

    extractPlanData(planRow) {
        let planName = planRow.querySelector('span[role="button"]').textContent.trim();
        planName = planName.replace(/\s*\(.*?\)\s*/g, '').trim();
    
        const premiumElement = planRow.querySelectorAll('.col-xs-4')[0];
        const premium = premiumElement.querySelector('strong').textContent.trim();
        
        const premiumWasElement = premiumElement.querySelector('span.effects-module__strikethrough___AxSwd');
        const premiumWas = premiumWasElement ? premiumWasElement.textContent.trim() : '';
    
        const deductibleElement = planRow.querySelectorAll('.col-xs-4')[1];
        const deductible = deductibleElement.querySelector('span').textContent.trim();
    
        const oopMaxElement = planRow.querySelectorAll('.col-xs-4')[2];
        const oopMax = oopMaxElement.querySelector('span').textContent.trim();

        const imageElement = planRow.querySelector('img');
        let imageAlt = imageElement ? imageElement.getAttribute('alt').trim() : '';
        imageAlt = imageAlt.replace(/\s*\(.*?\)\s*/g, '').trim();
    
        return {
            planName: planName,
            premium: premium,
            premiumWas: premiumWas,
            deductible: deductible,
            oopMax: oopMax,
            company: imageAlt
        };
    }

    scrapPlan() {
        let plans: Array<Plan> = []
        const planRows = this.sc.querySelectorAll('#aca-app-coverage-details .row');
        planRows.forEach((plan) => {
            const divs = plan.querySelectorAll(':scope > div');
            if (divs.length > 1) {
                const tableExists = divs[1].querySelector('table') !== null;
                if (tableExists) {
                    const plan_details = this.extractPlanData(divs[0])
                    const [_, plan_info] = this.sc.get_data_table('.//table', divs[1]);
                    const status = plan_info[0][0]
                    const ffm_id = Number(plan_info[0][6])
                    const hios_id = ""
                    const subscriber_id = plan_info[0][4]
                    const policy_id = plan_info[0][5]
                    const name = plan_details.planName
                    const effective = plan_info[0][1]
                    const termination = plan_info[0][2]
                    const premium = plan_details.premium
                    const deductible = plan_details.deductible
                    const opp_max = plan_details.oopMax
                    const dependents = plan_info[0][3].split(',')
                    const premium_total = plan_details.premiumWas
                    const carrier_phone = plan_info[0][7]
                    const company = plan_details.company
                    let payment_phone = ''
                    let agent_record = ''
                    if (plan_info[0].length > 8) {
                        payment_phone = plan_info[0][8]
                        agent_record = plan_info[0][9]
                    } else {
                        payment_phone = ''
                        agent_record = plan_info[0][8]
                    }
                    
                    plans.push(
                        new Plan(status, ffm_id, hios_id, subscriber_id, policy_id, name, effective, termination, premium, deductible, opp_max, premium_total, dependents, carrier_phone, payment_phone, agent_record, company)
                    )
                }
            }
        })

        return plans
    }
    
    scrapMember(): [Array<any>, any] {
        const xpath_application = "//div[@data-analytics-area='application-card']//table";
        const [_members, _owner] = this.sc.get_data_table(xpath_application);
    
        const processedMembers = _members.map((member) => {
            let updatedMember = [...member];
                const fullName = updatedMember[0];
    
            if (fullName && typeof fullName === 'string') {
                const nameParts = fullName.split(' ');
    
                if (nameParts.length > 1) {
                    updatedMember[0] = nameParts[0]; 
                    updatedMember.splice(1, 0, nameParts.slice(1).join(' ')); 
                }
            }
    
            return updatedMember;
        });
    
        return [processedMembers, _owner];
    }    

    parseAddress(addressString: string): Address {
        const regex = /^(.*?),\s*(.*?),\s*([A-Z]{2}),\s*(\d{5})/;
        const match = addressString.match(regex);
    
        const [ , address, city, state, zipcode ] = match;
        return new Address(address.trim(), city.trim(), state.trim(), zipcode.trim());
    }

    scrapPolicy(): Policy {
        const [_members, _owner] = this.scrapMember()
        let members: Array<Member> = []
        _members.forEach((member)  => {
            members.push(new Member(member[0], member[1], member[2], member[3], member[4], member[5].slice(-4), member[6]))
        })
        
        const address = this.parseAddress(_owner[0][2])
        const owner_member = new Member(members[0].firstname, members[0].lastname, members[0].gender, members[0].tobacco, members[0].dob, members[0].ssn, members[0].eligibility)
        console.log(members[0])
        console.log(owner_member)
        const owner = new Owner(address, _owner[0][0], "", _owner[0][1], ...Object.values(owner_member))
        
        const plans: Array<Plan> = this.scrapPlan()
        
        const policy = new Policy(owner, plans, members)
        console.log(policy)
        return policy
    }
    
}