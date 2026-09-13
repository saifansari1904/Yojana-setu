export type ActiveScreen =
  | 'login'
  | 'form'
  | 'results'
  | 'alternatives'
  | 'scheme-detail';

export interface RepaymentCalculation {
  principalAmount: number;
  interestRate: number;
  tenureYears: number;
  monthlyEmi: number;
  totalInterest: number;
  totalRepayment: number;
  principalPercentage: number;
  interestPercentage: number;
  subsidyAmount: number;
  effectivePrincipal: number;
  subsidizedEmi: number;
  monthlySavings: number;
}
