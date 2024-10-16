export class Plan {
    constructor(
        public status: string = '',
        public ffm_id: number = 1234567890,
        public hios_id: string = '45456FL546544',
        public subscriber_id: string = '',
        public policy_id: string = '',
        public name: string = '',
        public effective: string = '',
        public termination: string = '',
        public premium: string = '',
        public deductible: string = '',
        public opp_max: string = '',
        public premium_total: string = '',
        public dependents: Array<string> = [''],
        public carrier_phone: string = '',
        public payment_phone: string = '',
        public agent_record: string = '',
        public company: string = ''
    ) {
        //this.validate();
    }

    static fromJSON(json: any): Plan[] {
        const jsonArray = Array.isArray(json) ? json : [json];

        return jsonArray.map((item) => new Plan(
            item.ffm_id,
            item.hios_id,
            item.name,
            item.effective,
            item.termination,
            item.premium,
            item.deductible,
            item.max_payout,
            item.dependents
        ));
    }

    private validate(): void {
        // Validar ffm_id: exactamente 10 dígitos numéricos
        if (!/^\d{10}$/.test(String(this.ffm_id))) {
            throw new Error('ffm_id must have exactly 10 numeric digits.');
        }

        // Validar hios_id: formato "00000##000000"
        if (!/^\d{5}\w{2}\d{6}$/.test(this.hios_id)) {
            throw new Error('hios_id must be in the format "00000##000000".');
        }

        // Validar fechas: termination > effective y fechas válidas
        /* if (isNaN(this.effective.getTime())) {
            throw new Error('effective must be a valid date.');
        } */

        /* if (isNaN(this.termination.getTime())) {
            throw new Error('termination must be a valid date.');
        }
 */
        if (this.termination <= this.effective) {
            throw new Error('termination must be after effective date.');
        }

        // Validar premium, deductible, max_payout: deben ser números positivos
        if (typeof this.premium !== 'number' || this.premium < 0) {
            throw new Error('premium must be a positive number.');
        }

        if (typeof this.deductible !== 'number' || this.deductible < 0) {
            throw new Error('deductible must be a positive number.');
        }

        if (typeof this.opp_max !== 'number' || this.opp_max < 0) {
            throw new Error('max_payout must be a positive number.');
        }
    }
    
}