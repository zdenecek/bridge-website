<?php


// URL to send the POST request to
$url = "https://matrikacbs.cz/Prehled-hracu.aspx";

// The form data to be sent with the POST request
$data = [
    '__VIEWSTATE' => '/wEPDwUJMTQwMDE0Mjg0D2QWAmYPZBYCAgMPZBYIAgIPPCsADQIADxYCHgtfIURhdGFCb3VuZGdkDBQrAA0FMTA6MCwwOjEsMDoyLDA6MywwOjQsMDo1LDA6NiwwOjcsMDo4LDA6OSwwOjEwLDA6MTEUKwACFg4eBFRleHQFCUFrdHVhbGl0eR4FVmFsdWUFCUFrdHVhbGl0eR4LTmF2aWdhdGVVcmwFDS9EZWZhdWx0LmFzcHgeB0VuYWJsZWRnHgpTZWxlY3RhYmxlZx4IRGF0YVBhdGgFDS9kZWZhdWx0LmFzcHgeCURhdGFCb3VuZGdkFCsAAhYOHwEFBcOadm9kHwIFBcOadm9kHwMFCi9Vdm9kLmFzcHgfBGcfBWcfBgUKL3V2b2QuYXNweB8HZ2QUKwACFg4fAQUHUmFua2luZx8CBQdSYW5raW5nHwMFDS9SYW5raW5nLmFzcHgfBGcfBWcfBgUNL3JhbmtpbmcuYXNweB8HZ2QUKwACFhAfAQURUMWZZWhsZWQgaHLDocSNxa8fAgURUMWZZWhsZWQgaHLDocSNxa8fAwUTL1ByZWhsZWQtaHJhY3UuYXNweB8EZx8FZx8GBRMvcHJlaGxlZC1ocmFjdS5hc3B4HwdnHghTZWxlY3RlZGdkFCsAAhYOHwEFF1DFmWlobMOhxaFreSBuYSB0dXJuYWplHwIFF1DFmWlobMOhxaFreSBuYSB0dXJuYWplHwMFFS9WeXBzYW5lLXR1cm5hamUuYXNweB8EZx8FZx8GBRUvdnlwc2FuZS10dXJuYWplLmFzcHgfB2dkFCsAAhYOHwEFEVDFmWVobGVkIHR1cm5hasWvHwIFEVDFmWVobGVkIHR1cm5hasWvHwMFFS9QcmVobGVkLXR1cm5hanUuYXNweB8EZx8FZx8GBRUvcHJlaGxlZC10dXJuYWp1LmFzcHgfB2dkFCsAAhYOHwEFDlbDvXBpcyBzZXrDs255HwIFDlbDvXBpcyBzZXrDs255HwMFEi9WeXBpcy1zZXpvbnkuYXNweB8EZx8FZx8GBRIvdnlwaXMtc2V6b255LmFzcHgfB2dkFCsAAhYOHwEFFVbDvWtvbm5vc3Ruw60gdMWZw61keR8CBRVWw71rb25ub3N0bsOtIHTFmcOtZHkfAwUgL1ByZWhsZWQtdnlrb25ub3N0bmljaC10cmlkLmFzcHgfBGcfBWcfBgUgL3ByZWhsZWQtdnlrb25ub3N0bmljaC10cmlkLmFzcHgfB2dkFCsAAhYOHwEFEVDFmWVobGVkIHBvc3R1cMWvHwIFEVDFmWVobGVkIHBvc3R1cMWvHwMFFS9QcmVobGVkLXBvc3R1cHUuYXNweB8EZx8FZx8GBRUvcHJlaGxlZC1wb3N0dXB1LmFzcHgfB2dkFCsAAhYOHwEFFFppc2sgYm9kxa8gemEgdHVybmFqHwIFFFppc2sgYm9kxa8gemEgdHVybmFqHwMFHy9LYWxrdWxhY2thLWJvZHUtemEtdHVybmFqLmFzcHgfBGcfBWcfBgUfL2thbGt1bGFja2EtYm9kdS16YS10dXJuYWouYXNweB8HZ2QUKwACFg4fAQUPUMWZZWhsZWQga2x1YsWvHwIFD1DFmWVobGVkIGtsdWLFrx8DBRMvUHJlaGxlZC1rbHVidS5hc3B4HwRnHwVnHwYFEy9wcmVobGVkLWtsdWJ1LmFzcHgfB2dkFCsAAhYOHwEFCFZvdWNoZXJ5HwIFCFZvdWNoZXJ5HwMFDi9Wb3VjaGVyeS5hc3B4HwRnHwVnHwYFDi92b3VjaGVyeS5hc3B4HwdnZGQCBg8PFgQfAwU/P2ptZW5vPSZpZEtsdWJ1PSZjbGVuc3R2aT0ma2F0ZWdvcmllPSZwb2hsYXZpPSZpZFRyaWR5PSZmdW5rY2U9HgdWaXNpYmxlZ2RkAgcPFgIfAQURUMWZZWhsZWQgaHLDocSNxa9kAgkPZBYMAgMPEA8WAh8AZ2QQFSEKLS0gdsWhZSAtLQdCSyBCcm5vEUJLIEhFUk9MRCBPc3RyYXZhD0JLIENoYW9zIEJyaWRnZRtCSyBNw6FqIMSMZXNrw6kgQnVkxJtqb3ZpY2UMQksgUGFyZHViaWNlCEJLIFByYWhhD0JLIFRydXRub3Ygei5zLhZCSyBVaGVyc2vDqSBIcmFkacWhdMSbEkJLIFZ5c29rw71jaCDFoGtvbAxCUyBIYXbDrcWZb3YQSml6ZXJhIEJyaWRnZSBNQhBTZXZlcm/EjWVza8O9IEJLCVNsb3ZlbnNrbwtWw71ib3IgxIxCUwxaYWhyYW5pxI1uw60Nxb3DoWRuw70ga2x1YhHFvcW9IMSMZXNrw70gQnJvZAzFvcW9IEtyYWx1cHkMxb3FvSBMaWJlcmVjFcW9xb0gTmVrdcWZw6FjaSBQcmFoYQ/FvcW9IE5lcmF0b3ZpY2Udxb3FvSBOb3bDqSBNxJtzdG8gbmFkIE1ldHVqw60Mxb3FvSBPbHltcGlhDMW9xb0gT3N0cmF2YQzFvcW9IFJvxb5ub3YOxb3FvSBUT1AgUHJhaGEUxb3FvSBUxZlpbsOhY3QgUHJhaGEIxb7FvsW+IGIIxb7FvsW+IGMIxb7FvsW+IGQIxb7FvsW+IGUIxb7FvsW+IGYVIQABNAIzNAIzNwE1AjE5ATMCMjcCMjgCMzYBOAI0MgIzOAI0MQIzNQIzOQI0MAE2AjExAjEyAjEzAjE0AjE1AjE3AjE4AjIyAjMyAjI2AjE2AjI1AjIzAjEwAjI5FCsDIWdnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2RkAgsPEA8WAh8AZ2QQFRUKLS0gdsWhZSAtLQlOb3bDocSNZWsFQWRlcHQLUG9rcm/EjWlsw70SS2x1Ym92w70ga2FuZGlkw6F0DktsdWJvdsO9IG1pc3RyGEJyb256b3bDvSBrbHVib3bDvSBtaXN0chpTdMWZw61icm7DvSBrbHVib3bDvSBtaXN0chVabGF0w70ga2x1Ym92w70gbWlzdHISUmVnaW9uw6FsbsOtIG1pc3RyHEJyb256b3bDvSByZWdpb27DoWxuw60gbWlzdHIeU3TFmcOtYnJuw70gcmVnaW9uw6FsbsOtIG1pc3RyGVpsYXTDvSByZWdpb27DoWxuw60gbWlzdHIPTsOhcm9kbsOtIG1pc3RyGUJyb256b3bDvSBuw6Fyb2Ruw60gbWlzdHIbU3TFmcOtYnJuw70gbsOhcm9kbsOtIG1pc3RyFlpsYXTDvSBuw6Fyb2Ruw60gbWlzdHIIVmVsbWlzdHISQnJvbnpvdsO9IHZlbG1pc3RyFFN0xZnDrWJybsO9IHZlbG1pc3RyD1psYXTDvSB2ZWxtaXN0chUVAAExATIBMwE0ATUBNgE3ATgBOQIxMAIxMQIxMgIxMwIxNAIxNQIxNgIxNwIxOAIxOQIyMBQrAxVnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dkZAINDxAPFgIfAGdkEBUHCi0tIHbFoWUgLS0SxIxsZW4gdsO9Ym9ydSDEjEJTClJvemhvZMSNw60HVHJlbsOpcg5EZWxlZ8OhdCBrbHVidQ9QxZllZHNlZGEga2x1YnUQTWF0cmlrw6HFmSBrbHVidRUHAAExATIBNAE4Ai0xAi0yFCsDB2dnZ2dnZ2dkZAIPDxYCHwloZAIVDw8WBB4NT25DbGllbnRDbGljawWqPHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gJ21haWx0bzo/YmNjPW90YXN2b0BzZXpuYW0uY3o7Ozs7Ozs7OzttaWwubWFjdXJhQGdtYWlsLmNvbTttaWNoYWwua29wZWNreUBob3RtYWlsLmNvbTs7cGV0ci5wdWxrcmFiQGdtYWlsLmNvbTs7Ozs7Ozs7Ozs7Ozs7OztwYXZsYS5ob2Rlcm92YUBzZXpuYW0uY3o7YWxlcy5tZWRsaW5Adm9sbnkuY3o7Ozs7O21ya3dvc29mdEBnbWFpbC5jb207Ozs7Ozs7Ozs7Ozt6ZnJhYnNhQGdtYWlsLmNvbTs7Y2F5ZXR0YW5hQHNlem5hbS5jejs7OztldmFAZm9ydC5jejs7Ozs7OzthbGhhQGVtYWlsLmN6Ozs7Oztrb2h1dG92YS5sdWNrYUBzZXpuYW0uY3o7Ozt2YWNodGFyZEBnbWFpbC5jb207Ozs7OztrbGVtcy5lcmlrQGVtYWlsLmN6Ozs7bWFuYWtAbGVzcGkuY3o7bWFydGluLm1lbGNha0BzZXpuYW0uY3o7O3YubWFjaGF0QHNlem5hbS5jejs7OztsdWt5LmtvbGVrQHNlem5hbS5jejttaHB5QHBvc3QuY3o7cGF2ZWxAcGVrbnkuaW5mbzttYXJrZXRrYWRAY2VudHJ1bS5jejs7Ozs7dmJlcmFuQGNlbnRydW0uY3o7O2JvdG1pc0BzZXpuYW0uY3o7Ozs7OztwbG9za29ub2hAcG9zdC5jejs7emRuZWsudG9taXNAZ21haWwuY29tO21vbmlrYUBreXB0b3ZhLmN6Ozs7Ozs7Ozs7YWphbmFzQHZvbG55LmN6OztiYXRyb3Mud2ludGVyQHNlem5hbS5jejs7OztlZmZhY2VyQHNlem5hbS5jejs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7YmF0ZWxvdmlAY2VudHJ1bS5jejs7Ozs7Ozs7Ozs7YmF0ZWxvdmlAY2VudHJ1bS5jejs7O3NuaW1lQGJvYmlrYS5jejs7Ozs7Ozs7O3JlZGJsQHNlem5hbS5jejs7dmxhc3RpbWlsLnBvbGFuc2t5QHByYWdvZGF0YS5jOzs7O2psbEBzZXpuYW0uY3o7b2xvd3BiQGhvdG1haWwuY29tOzs7Ozs7b25kcmFrYXN0b3Zza3lAc2V6bmFtLmN6O2JvYnJAbmFqaWh1LmN6Ozttci5tYXNla0BnbWFpbC5jb207Ozs7O3BhdmVsQHRlbmFrLmV1Ozs7Ozs7Ozs7O2ouaC5tZWR1bmFAc2V6bmFtLmN6Ozs7Ozs7Ozs7Ozs7Ozt2aWNoZXJAbm92YXJvbGUuY3o7Ozs7OztzdGFyZWNla0BjZW50cnVtLmN6Ozs7O3BhdmVsc2lrb3JhQG1haWwuY29tO01pcm9zbGF2Lkt1bmVydEBzZXpuYW0uY3o7aG9yYWtAaGlwcm8uY3o7amFua2luZGxAZ21haWwuY29tO3JvYmt2YTNAZ21haWwuY29tOzs7Ozthbm5hQGNhbHVtaXRlLmN6O3pkZW5rYS50YXViZXJvdmFAc2V6bmFtLmN6Ozs7OztlbWlsLmZpYWxhQHN1amIuY3o7O2poZXJvdXRAb3N0cmF2YS5jejs7O21hamk1M0BzZXpuYW0uY3o7a3Jhc2Eub25kcmFAc2V6bmFtLmN6OztwaWNoYUBwaGlsLm11bmkuY3o7Ozs7Ozs7Ozs7aG9yYWtAZ29zdm8uY3o7bWFydGFub3Y0MkBzZXpuYW0uY3o7bS5qZWxpbmtvdmFAdm9sbnkuY3o7Ozs7OztrYWRsZWMucGF2ZWxAZ21haWwuY29tOzs7Ozs7a2FsdXppa0BoaXByby5jejs7Ozs7Ozs7Ozs7Ozs7O2FrY2l6dXJAYXRsYXMuY3o7cHN6Y3pvbGthQGdzaC5jejs7YmxhdG55QGluZm9ybS5jejs7Ozs7Ozs7Ozs7Ozs7O3Jvc2U5QHZvbG55LmN6Ozt2aXQud2FsYWNoQGdtYWlsLmNvbTs7Ozs7Ozs7Ozs7OztjaGVlc2RpYW1vbmdAZ21haWwuY29tOzs7YXJhZG9uQG1ib3gudm9sLmN6Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7emFsYnJlY2h0b3ZhQGVtYWlsLmN6Ozt2YWNsYXYua3lwdGFAc2V6bmFtLmN6Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O21pazc4QHNlem5hbS5jejs7O2Nlcm1ha292YUBkZG1jYi5jejs7O2hhcnRtYW5uQGd3LmN6c28uY3o7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O2didWJuaWtAYm1wYXJ0bmVycy5jejs7Ozs7Ozs7OztwaXNvdmEudkBzZXpuYW0uY3o7Ozs7O2FkYW1rdWtpa0BzZXpuYW0uY3o7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7b3N0cm11ekBpb2wuY3o7OzthcGxvc292YUBzZXpuYW0uY3o7Ozs7Ozs7Ozs7Ozs7Ozs7SGVsZW5lLkd1bGRicmFuZHNlbkB1aWIubm8gOzs7OztyYWRla2F2QHNlem5hbS5jejs7Ozs7Ozs7Ozs7O3JhZGtha3VsaGF2YUBzZXpuYW0uY3o7emVqZGxAaG90bWFpbC5jb207Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7dmxjZWtyQHppdm5vYmFua2EuY3o7O3pkZW5hdnRAY2VudHJ1bS5jejs7Ozs7Ozs7Ozs7Ozs7OztyYWRvamNpY196b3JhbkBob3RtYWlsLmNvbTs7Ozs7amFwcmFuYUBzZXpuYW0uY3o7Ozs7O21pbGFucHJhc2lsQHNlem5hbS5jejs7Ozs7Ozs7a3BleGFAamN1LmN6Ozs7O3VjZWNob3ZhQHNlem5hbS5jejs7O3BhdmVsLmZpbmZybGVAc2V6bmFtLmN6Ozs7O2phbl9wZXRyaWtAc2V6bmFtLmN6Ozs7Ozs7Ozs7Ozs7Ozs7O3ZpbGVtLnV2aXJhQHNlem5hbS5jejs7Ozs7Ozs7aXZhbi5ocmJla0BhdGVsaWVyLWhyYmVrLmN6Ozs7OztjdWJiaXNoQGdtYWlsLmNvbTtqb2huLmZyZXplckBnbWFpbC5jb207Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Y29udGFjdEBzdGVwYW5ncmVnb3IuY29tOzs7Ozs7c2FkaWxrb3ZhaEBzZXpuYW0uY3o7bWFyaWUuYWRhbW92YUB2b2xueS5jejs7Ozs7Ozs7Ozs7Ozs7Oztqb3NlZi5zcGFrQGdtYWlsLmNvbTs7Ozs7dmF2cmEuZGF2aWQuNTZAZ21haWwuY29tOzs7Ozs7Ozs7O2p1bmdvdmFrYUBnbWFpbC5jb207Ozs7Ozs7O2phcGFuY0BzZXpuYW0uY3o7O3JhZG9sZXphbEBnbWFpbC5jb207Ozs7bGVua2Euc2xhYmFAdm9sbnkuY3o7O2phbmEuam9AY2VudHJ1bS5jejs7O2pvbGFuYS5oZWpkdWtvdmFAc2V6bmFtLmN6Ozs7Ozthbm5haGFzYW5AeWFob28uY29tOzs7OztqLnN1Y2hvbWVsb3ZhQGhiaC5jejt3ZXBldHJAZ21haWwuY29tOzs7bWFyZ2FyZXRfcmF1Y2hAeWFob28uY29tO2xlbmthdmxrQHNlem5hbS5jejs7Ozs7Ozs7O2JsYW4ua29AY2VudHJ1bS5jejs7Ozs7Ozs7Ozs7OzttaS5za29Ac2V6bmFtLmN6Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7cGF2ZWwuY2l6YUBzZXpuYW0uY3o7amFuYS5ibGFodXNrb3ZhQHNlem5hbS5jejs7Ozs7cGFkcmRhbkBzZXpuYW0uY3o7Ozs7O2xlbmthQGxvY2huZXNreS5jejs7YmFyYXZhc2lja292YUBzZXpuYW0uY3o7Ozs7O3Nhc2EuaGFza292YUBzZXpuYW0uY3o7Ozs7Ozs7Ozs7O21hcmVrLmxvdWtvdGthQGVtYWlsLmN6Ozs7Ozs7O2NodWNodXQxQHNlem5hbS5jejtqYXJtaWxhZG9jZWthbG92YUBlbWFpbC5jejs7Ozs7Ozs7O2NhcmV5LnZvc2Vja2FAZ21haWwuY29tOzs7Ozs7Ozs7bmV0NzNwc0BnbWFpbC5jb207O2pha3ViLmh1bXBhbEBnbWFpbC5jb207Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7amFob3JhY2VrNDFAc2V6bmFtLmN6O3pkZW5lay5rcml6QHZyZXouY3o7Ozs7ZXZhc3VjaGFua2FAY2VudHJ1bS5jejs7Ozs7Ozs7O2hzcGF0bmFAc2V6bmFtLmN6Oztkcl9qaXRrYUBlbWFpbC5jejs7Ozs7Ozs7Ozs7Ozs7Ozs7UGF2ZWx4SEBzZXpuYW0uY3o7Ozs7OztiZXJhbnN0YW5kYUBhdGxhcy5jejttYWxpbmVjemthQHNlem5hbS5jejs7Ozs7Ozs7Ozs7Ozs7Ozs7d2VybmVybWljaEBnbWFpbC5jb207Ozs7Ozs7bWFyZWsuYnViZW5pY2VrQHNlem5hbS5jejs7O2thcmVsamVsaW5lazExQHNlem5hbS5jejs7Ozs7Ozs7Ozs7OzttaWxhbi5oYW5kbG92aWNAY2VudHJ1bS5jejs7Ozs7Ozs7Ozs7Ozs7Ozs7cGV0cjIuYmxoQGdtYWlsLmNvbTs7ai50cmFqaGFuQHNlem5hbS5jejs7Ozs7Ozs7O2phY2h5bWZpbGltMDJAc2V6bmFtLmN6Ozs7Ozs7enV6YXNldmFAc2V6bmFtLmN6OztqYW5hLnBzZW5pY2tvdmFAdXpzdm0uY3o7Ozs7YmxhbmthLnJ1emlja292YUBjZW50cnVtLmN6Ozs7Ozs7aHJvbmtvdmFAcG9zdC5jejs7O2tvbWFya292YS5oYW5hQGdtYWlsLmNvbTs7Ozs7Ozt6cmVjb3ZhQHNlem5hbS5jejs7OztqdXJhLmhvcmFrQGdtYWlsLmNvbTs7aGFuYV9ob3JAc2V6bmFtLmN6O3JhamthbGFAc2V6bmFtLmN6Ozs7Ozttb3JhdmNvdmEuamFuY2FAc2V6bmFtLmN6OztNYXJrb3ZhLkFsZW5hQGVtYWlsLmN6Ozs7Ozs7ZGFuYS5rb2xhcm92YUBnbWFpbC5jb207Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O2Zyb25lbWFAZ21haWwuY29tOzs7Ozs7Ozs7cm9tLmNoYWx1cGFAc2V6bmFtLmN6Ozs7OztwZXRlci5kdWJuaWNreUBnbWFpbC5jb207bW1pa292YUBzZXpuYW0uY3o7bWFnZGEubW91Y2hvdmFAc2V6bmFtLmN6Ozs7Ozs7OztsZW5nYWxvdmEuYUBjZW50cnVtLmN6O2phcnN0cm5hZEBnbWFpbC5jb207O2xvdWlzZS50YmVlckBnbWFpbC5jb207Ozs7Ozs7YWRlbGFsYUBjZW50cnVtLmN6Oztqb3plZnBydWNobmVyb3ZpY0BnbWFpbC5jb207O3ZlbmR1bGEubW9yYXZjb3ZhQHNlem5hbS5jejtraWtpbHV4QHNlem5hbS5jejs7Ozs7Ozs7Ozs7Ozs7O2pqc3RhZmxAc2V6bmFtLmN6OztiYWNvdmEuaGFAc2V6bmFtLmN6OztsYWRhLmJhY2FAZW1haWwuY3o7amEueml0QGNlbnRydW0uY3o7Ozs7Ozs7Ozs7O2Jpc2lja3lAdC1vbmxpbmUuZGU7Ozs7Ozs7Ozs7bWFreS5tYWNoMDJAc2V6bmFtLmN6Ozs7bmF0YXNhLml2QHNlem5hbS5jejtza3lsb3JAc2V6bmFtLmN6O3pieXNlay5obGF2YWNAZ21haWwuY29tOzs7Ozs7OztqYSticmlkZ2VAbWF0ZWpjaWsuY3o7Ozs7Ozs7Ozs7O2t5a3luNjM2QHNlem5hbS5jejs7Ozs7O2V2YS5sZW5jb3ZhQGF1cm90b25yZWFsaXR5LmN6OztuYXRhbGthLmtvc0BzZXpuYW0uY3o7Ozs7Ozs7a2EubWFya3ZhcnRvdmFAZ21haWwuY29tOzs7Ozs7amFtaWtlMkBnbWFpbC5jb207cmVuYXRhdmFuZWNrb3ZhQHBvc3QuY3o7Ozs5dmFuZGFAc2V6bmFtLmN6O3Zub3Z5QHZub3Z5Lm5ldDs7Ozs7Ozs7Ozs7Ozs7bWlsYW4ud2Vpc3NnYXJiZXJAZ21haWwuY29tOzs7Ozs7enV6YW5hLnBhdWx1c292w6FAZ21haWwuY29tO2x1Y2lrODU4QHNlem5hbS5jejs7ZGFuaXJ1c0BzZXpuYW0uY3o7OztqYW5hbWFydGVAc2V6bmFtLmN6Ozs7Ozs7Ozs7YW5vdmE0MUBzZXpuYWFtLmN6O3RvbWFydGFuQHNlem5hbS5jejs7bGluaGFydG92YS50ZXJlemFAZ21haWwuY29tO3JlaHVsYWFAY2VudHJ1bS5jejs7Ozs7Ozs7Ozs7bS5wYWNha292YUBxdWljay5jejs7Ozs7dmVuZHkubGhvdGFrb3ZhQHZvbG55LmN6Ozs7O2FubmEucGlsYXJvdmFAb3V0bG9vay5jb207O21kdm9yYWNAZ21haWwuY29tOzs7OzthLnBhY2FrQHF1aWNrLmN6O3p1emthLmN5bWJhbG92YUBnbWFpbC5jb207Ozt6YWJhLnJvcHVjaGFAdGlzY2FsaS5jejs7Ozs7Ozs7Ozs7c3BvcmNsb3ZhakB0aXNjYWxpLmN6Ozs7Ozs7amFuYS5maWd1c0BnbWFpbC5jb207amlyaUBmYWxpcy5jejs7aGVybWlrQGF0bGFzLmN6O2FkYW0uemFra0BnbWFpbC5jb207Ozs7Ozs7Ozs7Ozs7Ozs7YnJvbmEuemllbGVuaWVjQGdtYWlsLmNvbTs7O21hcnRpbi5kZWRlazY2NkBnbWFpbC5jb207O21haWx0bzppdHVja292YTFAZ21haWwuY29tO2FuZHJlYWppcnNvdmFAc2V6bmFtLmN6O3Zyc2VrdmxhZGltaXJAc2V6bmFtLmN6O3JlbmF0ZS5zdHJlaW1lbHdlZ2VyQGNoZWxsby5hdDthbm5hLnZlcnRAaGV5LmNvbTs7YWRhbS5kb2NrYWxla0BnbWFpbC5jb207bWFnZGFsZW5hLmkucmVndWxhQGdtYWlsLmNvbTs7Ozs7Ozs7O3NpbW9ucmF3bGVuY2VAZ21haWwuY29tOzs7Ozs7OzthbmV6a2Euc3RhcmZsb3dAc2V6bmFtLmN6O3BhbGtpa2lAc2V6bmFtLmN6O2thdGVyaW5hLmt1dGhhbm92YUBwb3N0LmN6O2thcm9saW5hc2Vkb3ZhMDNAZ21haWwuY29tOzs7Ozs7Ozs7bGF6dWtpYzJAdm9sbnkuY3o7O0JhcmNhMjA1QHNlem5hbS5jejtsZW11cmthY2thQGNlbnRydW0uY3o7Ozs7IGV2YS5wdXplam92YUBjZXouY3o7Ozs7Ozs7Ozs7c2Fua29AbGUtdHJlbmQuc2s7ZGVkZWtwZXRyQHNlem5hbS5jejtkYXYuY2VybmlrQGdtYWlsLmNvbTt2b2p0ZWNoLnR2cmRpa0BtZW5zYS5jejs7Ozs7dG9tX21hcmVzQHlhaG9vLmNhO21hcmVzbm9yYUB5YWhvby5jb207amFybWloZWxAc2V6bmFtLmN6OyBodW1vcmRvc3RhQHNlem5hbS5jejtqYW5hLnN0b3Nha292YUBjZW50cnVtLmN6O3Zlcm9uaWthLnZsY2tvdmFAY2VudHJ1bS5jejt0b21hc19oZXJ5LnBheW5lQG1lbnNhZ3ltbmF6aXVtLmN6O3JpY2hhcmQuZG9iaXNla0BtZW5zYWd5bW5hc2l1bS5jejtkYWcubGFuZ2tyYW1lckBtZW5zYWd5bW5hc2l1bS5jejtrbGFyYS5mdXRlam92YUBtZW5zYWd5bW5hc2l1bS5jejthZGFtLmNlbGVja3lAbWVuc2FneW1uYXNpdW0uY3o7O1Bhd2VsLndvbHNraUBhb2wucGw7Ozs7OzsgaGFtYXJvdmFAcHN2LmN2dXQuY3o7IGhlcm1pay5tQHNlem5hbS5jejsga2xpbWVudG92YXNAYWJrb21wbGV0LmN6OyBkc2V2ZXJvdmFAc2V6bmFtLmN6OyBtaWxhZGFzY2htaWRsb3ZhQGNlbnRydW0uY3o7IHB1bHNhdGlsYUBjZW50cnVtLmN6OyBrYXRlcmluYXZhbHRyb3ZhQGVtYWlsLmN6OyBiYXQwNkBzZXpuYW0uY3o7IGRlZGtvLml2YW5hQHNlem5hbS5jejs7Ozs7OzsgbXJhemtvdmEuYW5rYUBzZXpuYW0uY3o7Ozs7Ozs7OztrYXBlc2tvMDA0QGdtYWlsLmNvbTtqb3NlZnNpbXBhcnRsQGdtYWlsLmNvbTtyZW5hdGFjaXprb3ZhNzdAZ21haWwuY29tOzs7Ozs7Ozs7Ozs7a3ZvbmRyQHNlem5hbS5jejtrYWxvc292YUBzZXpuYW0uY3o7c2FzYV91cmJhbkB5YWhvby5mcjt6dXphbmEua29yaXRzY2hhbm92YUBnbWFpbC5jb207Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztkYWxlckBwb3N0LmN6O2phbmF2YW5rb3ZhQHltYWlsLmNvbTttaWxlbmEua2FkZXJhYmtvdmFAZ21haWwuY29tOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozt2aWNob3ZhQGNlbnRydW0uY3o7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O2RhbnltYWlsQHNlem5hbS5jejtoZWxlbmFoYXJhdXRvdmFAZ21haWwuY29tOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7ai5uZXBvbXVja2FAZ21haWwuY29tO2phbmNoYWxvdXBla0BzZXpuYW0uY3o7Qmxha2V0aWNAdGlzY2FsaS5jejtoZXJvLjIwMDNAdm9sbnkuY3o7dG9tZmFiaWFuQHZvbG55LmN6O21hcmllYnJvemlrb3ZhQHNlem5hbS5jejt6Lm1hY2hhdG92YUBzZXpuYW0uY3o7aWxvbmEua29ob3V0b3ZhQGJucHBhcmliYXMuY29tO251dHIuaGFuYUBzZXpuYW0uY3o7aG9sa2F2eXNva2FAc2V6bmFtLmN6O21pcmthLnZva291bm92YUBhdGxhcy5jejs7OztsYW5rb3ZhekBzZXpuYW0uY3o7dmVyaGFlZ2VuLm1hcmNlbEBnbWFpbC5jb207Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzttYXJ2YWMyNDNAZ21haWwuY29tO2thbGFsLmtyeXN0b2ZAZ21haWwuY29tO2phay5jaGFsdXBhQGdtYWlsLmNvbTtqaXRrYWdyZXBsb3ZhQHNlem5hbS5jejtyLmh1YmVydG92YUBzZXpuYW0uY3o7dm9qdGEuZG9taW5AY2VudHJ1bS5jejticnVub21lbmNsMzYwQGdtYWlsLmNvbTtkcmFnb25hMTdAY2VudHJ1bS5jejtnZ2ZmenpAZ21haWwuY29tOzs7YnJvbmFzbGFka292YUBjZW50cnVtLmN6O21lZGtvdmFtQHNlem5hbS5jejs7Ozs7O2V2YS5jZWNodXJvdmFAZW1haWwuY3o7amFuc29uY3pAeWFob28uY28udWs7bWlsYWRhLnBvZGxlbm92YUBjaXR5b2ZwcmFndWUuY3o7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7JzsgcmV0dXJuIGZhbHNlOx8JaGRkAhkPD2QPEBYJZgIBAgICAwIEAgUCBgIHAggWCRYCHg5QYXJhbWV0ZXJWYWx1ZWUWAh8LZRYCHwtlFgIfC2UWAh8LZRYCHwtlFgIfC2UWAh8LaBYCHwtkFglmZmZmZmZmZgIDZGQYAwUeX19Db250cm9sc1JlcXVpcmVQb3N0QmFja0tleV9fFgIFEWN0bDAwJGN0bDA5JGN0bDAxBRFjdGwwMCRjdGwwOSRjdGwwMwUSY3RsMDAkY3BoJGdyZEhyYWNpDzwrAAwBCAIBZAULY3RsMDAkY3RsMDcPD2QFEVDFmWVobGVkIGhyw6HEjcWvZINI39X941L5y66jB9W1LJGbnMfC403myGLuMyYWGYHu',
    '__VIEWSTATEGENERATOR' => '4E0B2120',
    '__EVENTVALIDATION' => '/wEdAFtrU+jOITbtDwxxOKu+kxAkmr5xZrzqsQjkWatduMcploM9Fx02wJc0Glf6Wbt+ISDkOeyFJQT7o/O/aaJXa63ixPKM3X/92PiHae5bQPAo+H211sftREIsvLpZexhqEZL1YD/FZWcv/eGd38Ea65fMjg/5ZUibr5RT7HHmyATetSWSb8kNNIHMZ3MmGROdJJVt/+OfoEEUJ+C6yZctDRfXTzxOjMum7bOKDa6bvCRfU+nx64+H3X8OAhuQxeKOinodIF6KOMnkbUO8xXnzE+fcPImHhR2Z5p+BjVktP0cOHbpGehSC7I0n9bZGge246R2IXt1wlz4JGHWE7BCZxfj/MhiMyPDLCnyzL/yglmC1waOgAjRRkzGQtByai/O3yw7rXtZi9ujHI1/hjZVN+C2d8IbMb4ljiqPYs3I50chKcXWiugABYkD2Ei0aOazZiNFD9QpJMKP63GRrbqsXiPvGq6BGgcixVTMNxqAgb9Rx9MFtbRTRYfnH01tpRocjQKDIeGw/SHvDcgHeev8TDsEQvn0WRTPdtrHzPuvL7Sf1q3cU0+l5rcg9JjUl421aTf+IqYT7hBmsL2KwTFrTX5dfxMsmd8CgX8qknmYhr5MXpB0NZspEeaIS7eDNyLScRJE7UvdC/UBCOf5MfrMAltezbW4frmefeOgaSSkjAnlThWOucxhaOCzwYf/k2gjBgT8xU3Mh9WSL9QQuFrxXAzwBYchRgOgkke3Ern7cXnG0YsGS23XOVPxtes0Ox77eEULiLLwHJusGrlsJbHFx3IyakbPUEtymCLxIJwpMqCq4y0FjX18uDRGF61CzHUdwHQMv/9yyTNGAypyJDulFrqwcY2ZJdk8MoZo7bxJc0pmUUJR9ptTtAghrkXNci3J9inkVAiFf6yTlWBfO0Xc1KsoYngoTvkECaYEZYlqgXMy6ZBj2P6WGwX/w0z7/0eLKm7r1zEDNxe90gUt0uA4OayjSrWQzD4EGhRE4u1XV9LfS0fPtaIwiQNukm4wiRl2NdK0y1qQUrSVHYk9vxMarbgk+V7myrkwXMdP3OHcc8mRHTr9Qade3Ot8PsdzsILqchVBl9nVpvuwcX6aOpalXbG3Cex6IH4R/NnhSpRvQMwg5pFUIRQhhSCvl416j5kQu99677t1tLtRHQjqUsxeI9S8C1YL1dYswr/BH57Zhbe7AY4krI9ZVPYKmM5rBdZcgYyDgEYXmP0c82DJAoICW1IDpfNiXRi/d5xmDUrIeyMiaDd2xY+eYr7J/0qI74joBEwKwDSThWP6eZLXmmLTy1A+ooDGtkBRbT7WsZlVw74gw3xHQty98LRiCa06ZOgGkyrjvYIfodPPmLcbFCF5oMbtECmnfjMgMLN4UkUPKKvcBW9Ukf2yz/+uwDt9qOyvXX60F7eSydOvyUs7enJjgoAzDmqyd6JoVtWLWbc/kT9Jw76SMRtFdBFTIX03KL6soJpuPdidJ0fuSxuw1UcqeHzy3/Kbsfkh4i0GmuiyJVtC/u0rS3H8aSwrxVAjFqyY+iiPAX9plzQvc2FdbLqSRIblFHuvobtFK5gI1eblxDw2DibXF/+XlbbEsT2FTh+k6DJ7Jp7PcoNyvVVihDQIejenRlAbvohjOgs1ioOdsnxYcVf18jr0Nxbh23NDnHVxt9AXjeLDGRRwyxF0xGh0OkZgTVRTn2XtHdQkPDybbCNk2QZiex35AVUeeuvAS/Vcm9NckjBZ6bpSjJT2qzR40rmLfKfrGr/Iaq/mJVtC7Ob57ZQbUxSD9TmPFS5+++OQBVos9lil5b0s7L93ezdGR4nK6MTbI7LOvDdzThnTOYK022aqoytlAw6Maix3ZLsuy4j8JwSTOMXChmhvSalONBSVh+CQJfBDXAvh5QBoLRZsEuJQ1E5tUJ8YEseV6rqS5er7Ml7P1gs9EOdCa17Wj7Nu9OQYy7rMSd9Rt3kS/+Wn64JdlhO++VO9Qei51UYTFcps=',
    'ctl00$cph$btnCSV' => 'Export do CSV'
];

// Initialize cURL session
$ch = curl_init($url);

// Configure cURL options
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); // Return the response as a string
curl_setopt($ch, CURLOPT_POST, true); // Set the request method to POST
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data)); // Attach the form data

// Execute the POST request
$response = curl_exec($ch);

// Check if there was an error
if (curl_errno($ch)) {
    echo 'Error:' . curl_error($ch);
    exit;
}

// Close the cURL session
curl_close($ch);

// Convert the response from CP1250 to UTF-8
$convertedResponse = iconv("CP1250", "UTF-8//TRANSLIT", $response);

// Check if the remap_columns parameter is set
$remapColumns = isset($_GET['remap_columns']) && $_GET['remap_columns'] == '1';

// Convert semicolon-separated CSV to comma-separated and map columns
$lines = explode(PHP_EOL, $convertedResponse);

// Skip the first line (header line)
array_shift($lines);

$mappedCsv = [];
$headers = ["Pid", "FirstName", "LastName", "Rank", "District", "Sex", "AgeCategory", "Club", "Discount", "MembershipFee", "BboUsername"];

// Only add headers if remapping
if ($remapColumns) {
    $mappedCsv[] = implode(",", $headers);
}
function getCategoryFromYear(int $year) : string {
    // Possible categories based on the year
    $currentYear = (int)date('Y');
    $age = $currentYear - $year;

    if ($age < 16) {
        return 'U16';
    } elseif ($age < 21) {
        return 'U21';
    } elseif ($age < 26) {
        return 'U26';
    } elseif ($age > 65) {
        return 'Senior';
    } else {
        return ''; // For ages 27-64
    }
}

$mappedCsv = [];

foreach ($lines as $line) {
    $columns = str_getcsv($line, ";"); // Parse semicolon-separated CSV
    
    if ($remapColumns && count($columns) >= 10) {
        $category = "";
        if (is_numeric($columns[8])) { // Check if column 8 contains an integer
            $birthYear = (int)$columns[8]; // Parse the integer
            $category = getCategoryFromYear($birthYear); // Get the category
        }

        $mappedRow = [
            'Pid' => $columns[0],
            'FirstName' => $columns[2],
            'LastName' => $columns[1],
            'Rank' => '1', // Empty
            'District' => '', // Empty
            'Sex' => $columns[6] == "Z" ? "Female" : "Male", // Gender mapping
            'AgeCategory' => $category,
            'Club' => $columns[4],
            'Discount' => '0',
            'MembershipFee' => '0',
            'BboUsername' => '' // Empty
        ];
        $mappedCsv[] = implode(",", $mappedRow);
    } else {
        // If not remapping, just convert the line to comma-separated
        $mappedCsv[] = implode(",", $columns);
    }
}

// Set headers to return a CSV file
header('Content-Type: text/csv; charset=UTF-8');
if($remapColumns) 
    $fileName = "playersCBS_TournamentCalculator.csv"; 
else 
    $fileName = "playersCBS.csv"; 


header('Content-Disposition: attachment; filename="' . $fileName . '"');
// Add no-cache headers
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");


// Output the mapped and converted CSV content
echo implode(PHP_EOL, $mappedCsv);

?>