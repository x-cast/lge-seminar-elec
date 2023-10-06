!macro customInstall 
    DetailPrint "Register lgeadminseminar URI Handler" 
    DeleteRegKey HKCR "lgeadminseminar" 
    WriteRegStr HKCR "lgeadminseminar" "" "URL:lgeadminseminar" 
    WriteRegStr HKCR "lgeadminseminar" "URL Protocol" "" 
    WriteRegStr HKCR "lgeadminseminar\DefaultIcon" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME}" 
    WriteRegStr HKCR "lgeadminseminar\shell" "" "" 
    WriteRegStr HKCR "lgeadminseminar\shell\Open" "" "" 
    WriteRegStr HKCR "lgeadminseminar\shell\Open\command" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME} %1" 
!macroend