import { RepaymentCalculation } from '../types';

export function calculateRepayment(
  principalAmount: number,
  interestRateAnnual: number,
  tenureYears: number,
  subsidyRatePercent: number = 0
): RepaymentCalculation {
  const principal = Math.max(10000, principalAmount);
  const rateAnnual = Math.max(0.1, interestRateAnnual);
  const tenure = Math.max(1, tenureYears);

  const monthlyRate = rateAnnual / (12 * 100);
  const totalMonths = tenure * 12;

  // Standard EMI formula: P * r * (1+r)^n / ((1+r)^n - 1)
  const factor = Math.pow(1 + monthlyRate, totalMonths);
  const monthlyEmi = Math.round((principal * monthlyRate * factor) / (factor - 1));

  const totalRepayment = Math.round(monthlyEmi * totalMonths);
  const totalInterest = Math.max(0, totalRepayment - principal);

  const principalPercentage = Math.round((principal / totalRepayment) * 100);
  const interestPercentage = 100 - principalPercentage;

  // Capital subsidy calculations
  const subsidyAmount = Math.round(principal * (subsidyRatePercent / 100));
  const effectivePrincipal = Math.max(0, principal - subsidyAmount);

  let subsidizedEmi = monthlyEmi;
  if (effectivePrincipal > 0) {
    subsidizedEmi = Math.round((effectivePrincipal * monthlyRate * factor) / (factor - 1));
  }
  const monthlySavings = Math.max(0, monthlyEmi - subsidizedEmi);

  return {
    principalAmount: principal,
    interestRate: rateAnnual,
    tenureYears: tenure,
    monthlyEmi,
    totalInterest,
    totalRepayment,
    principalPercentage,
    interestPercentage,
    subsidyAmount,
    effectivePrincipal,
    subsidizedEmi,
    monthlySavings,
  };
}
