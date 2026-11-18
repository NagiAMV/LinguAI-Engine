'use client';
import {useEffect} from 'react';
import {trackVisit,flushAnalytics} from '@/lib/anonymous-analytics.mjs';
export default function AnonymousAnalytics(){
 useEffect(()=>{trackVisit();const visible=()=>{if(document.visibilityState==='visible')trackVisit();};window.addEventListener('online',flushAnalytics);document.addEventListener('visibilitychange',visible);return()=>{window.removeEventListener('online',flushAnalytics);document.removeEventListener('visibilitychange',visible);};},[]);
 return null;
}
