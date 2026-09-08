"use client";
import { BusinessRecovery } from "@/components/business-recovery";
export default function ErrorPage({retry}:{error:Error;retry:()=>void}){return <BusinessRecovery retry={retry}/>;}
