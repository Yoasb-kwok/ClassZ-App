import { assetUrl } from './api'
import { NO_PHOTO, studentKey, feedbackKey, type CoachClass, type LearningRecordValue } from './coach-schedule-screens'
export type CoachBootstrap = { profile: Record<string, any>; centres: {id:number;name:string;district:string}[]; connections:{id:string|number;centre_id:number;role:'Coach'|'Manager';status:'invited'|'requested'|'connected'}[]; classes:any[] }
const fallback = require('../assets/figma/coach/schedule/checkin.jpg')
const placeName = (v: any) => String(v || '').trim().split(/[-_]+/).filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join(' ')
const parse = (v: any) => typeof v === 'string' ? JSON.parse(v) : v
export function coachClasses(data: CoachBootstrap): CoachClass[] {
 return data.classes.map(c => {
  const date=new Date(c.start_time),end=new Date(c.end_time),startMinutes=date.getHours()*60+date.getMinutes(),endMinutes=end.getHours()*60+end.getMinutes()
  const siblings=data.classes.filter(x=>x.program_code&&x.program_code===c.program_code).sort((a,b)=>new Date(a.start_time).getTime()-new Date(b.start_time).getTime())
  const roster=c.roster.map((s:any)=>({enrolledAt:s.enrolled_at,enrollmentId:Number(s.enrollment_id),profileId:Number(s.profile_id),name:s.name||'Learner',photo:s.photo_url?{uri:assetUrl(s.photo_url)!}:NO_PHOTO,sen:false,age:s.date_of_birth?Math.max(0,Math.floor((Date.now()-new Date(s.date_of_birth).getTime())/31557600000)):0,male:Number(s.sex)===1}))
  const clock=(d:Date)=>d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})
  return {id:String(c.id),key:/academic|math|english|chinese/i.test(c.name)?'academic':`class-${c.id}`,title:c.name,course:c.name,time:`${clock(date)}-${clock(end)}`,startMinutes,endMinutes,color:c.calendar_color||'#0ABAB5',image:c.image_url?{uri:assetUrl(c.image_url)!}:fallback,attendee:{kind:'group' as const,count:roster.length},sen:false,date,lesson:siblings.length?siblings.findIndex(x=>Number(x.id)===Number(c.id))+1:1,sessionDates:siblings.length?siblings.map(x=>new Date(x.start_time)):[date],price:c.price!=null?Number(c.price):null,rating:c.rating!=null?Number(c.rating):null,capacity:Number(c.capacity)||0,location:placeName(c.location),language:c.language||"",ageTag:c.age_tag||"",totalLessons:Math.max(Number(c.total_lessons)||0,siblings.length,1),roster,centerName:data.centres.find(x=>Number(x.id)===Number(c.center_id))?.name}
 })
}
export function coachSavedState(data:CoachBootstrap,classes:CoachClass[]) {
 const records:Record<string,LearningRecordValue>={},checked:Record<string,string[]>={},done=new Set<string>(),announcements:Record<string,{id:string;text:string;image?:string}[]>={}
 data.classes.forEach(c=>{
  const item=classes.find(x=>x.id===String(c.id))!;checked[item.id]=item.roster!.filter(s=>c.roster.some((r:any)=>Number(r.enrollment_id)===s.enrollmentId&&r.check_in_time)).map(studentKey)
  announcements[item.id]=c.announcements.map((a:any)=>({id:String(a.id),text:a.text,image:a.image}))
  c.records.forEach((r:any)=>{
   const st=item.roster?.find(s=>s.enrollmentId===Number(r.enrollment_id));if(!st)return
   const key=feedbackKey(item,st);done.add(key)
   records[`${key}|${item.lesson}`]=r.form?parse(r.form):{focus:r.class_focus||'',progress:String(r.progress_level||'').replace(/^./,(v:string)=>v.toUpperCase()),observed:parse(r.observed)||[],strongest:parse(r.strongest_areas)||[],attention:parse(r.attention_areas)||[],suggestion:r.student_work_on||'',traits:parse(r.learning_traits)||[],comment:r.additional_comment||'',photos:r.photo_url?[r.photo_url]:[]}
  })
 })
 return {records,checked,done,announcements}
}
