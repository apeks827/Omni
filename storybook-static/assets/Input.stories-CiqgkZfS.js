import{n as e}from"./chunk-BneVvdWh.js";import{O as t}from"./iframe-DZjbTUJX.js";import{a as n,n as r,o as i,r as a,t as o}from"./tokens-B2beOZTh.js";import{t as s}from"./jsx-runtime-DXFqSddf.js";var c,l,u=e((()=>{t(),a(),c=s(),l=({label:e,error:t,helperText:a,fullWidth:s=!1,style:l,disabled:u,...d})=>{let f={width:s?`100%`:`auto`,padding:`${n.sm} ${n.md}`,fontSize:i.fontSize.md,lineHeight:i.lineHeight.normal,color:r.dark,backgroundColor:u?r.gray100:r.white,border:`1px solid ${t?r.danger:r.gray300}`,borderRadius:o.md,outline:`none`,transition:`border-color 0.2s ease`,fontFamily:`inherit`,...l},p={display:`block`,marginBottom:n.xs,fontSize:i.fontSize.sm,fontWeight:i.fontWeight.medium,color:r.dark},m={marginTop:n.xs,fontSize:i.fontSize.xs,color:t?r.danger:r.gray600};return(0,c.jsxs)(`div`,{style:{marginBottom:n.md},children:[e&&(0,c.jsx)(`label`,{style:p,children:e}),(0,c.jsx)(`input`,{style:f,disabled:u,...d}),(t||a)&&(0,c.jsx)(`div`,{style:m,children:t||a})]})},l.__docgenInfo={description:``,methods:[],displayName:`Input`,props:{label:{required:!1,tsType:{name:`string`},description:``},error:{required:!1,tsType:{name:`string`},description:``},helperText:{required:!1,tsType:{name:`string`},description:``},fullWidth:{required:!1,tsType:{name:`boolean`},description:``,defaultValue:{value:`false`,computed:!1}}}}})),d,f,p,m,h,g,_,v;e((()=>{u(),d={title:`Design System/Input`,component:l,parameters:{layout:`centered`},tags:[`autodocs`],argTypes:{label:{control:`text`},error:{control:`text`},helperText:{control:`text`},fullWidth:{control:`boolean`},disabled:{control:`boolean`}}},f={args:{placeholder:`Enter text...`}},p={args:{label:`Name`,placeholder:`Enter your name`}},m={args:{label:`Email`,placeholder:`Enter your email`,error:`Invalid email address`}},h={args:{label:`Password`,placeholder:`Enter password`,helperText:`Must be at least 8 characters`,type:`password`}},g={args:{label:`Full Width Input`,placeholder:`This input takes full width`,fullWidth:!0}},_={args:{label:`Disabled Input`,placeholder:`Cannot edit`,disabled:!0}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {
    placeholder: 'Enter text...'
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Name',
    placeholder: 'Enter your name'
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Email',
    placeholder: 'Enter your email',
    error: 'Invalid email address'
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Password',
    placeholder: 'Enter password',
    helperText: 'Must be at least 8 characters',
    type: 'password'
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Full Width Input',
    placeholder: 'This input takes full width',
    fullWidth: true
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Disabled Input',
    placeholder: 'Cannot edit',
    disabled: true
  }
}`,..._.parameters?.docs?.source}}},v=[`Default`,`WithLabel`,`WithError`,`WithHelperText`,`FullWidth`,`Disabled`]}))();export{f as Default,_ as Disabled,g as FullWidth,m as WithError,h as WithHelperText,p as WithLabel,v as __namedExportsOrder,d as default};