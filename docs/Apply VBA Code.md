'Search폼에서 모집공고를 클릭하는 순간 실행되게 하기 위해 별도 Sub 프로시저로 작성
Sub Apply_Setting()

    Dim WinHTTP As Object
    Dim html As MSHTML.htmlDocument
    Dim htmlOption As MSHTML.IHTMLOptionElement

    Dim rUrl As String
    Dim i As Integer


    rUrl = "https://www.applyhome.co.kr/ai/aia/selectAPTLttotPblancListView.do"

    Set html = CreateObject("HtmlFile")
    
    Set WinHTTP = CreateObject("WinHttp.WinHttpRequest.5.1")
        With WinHTTP
            .Open "POST", rUrl
            .setRequestHeader "Content-Type", "application/x-www-form-urlencoded"
            .send
            .waitForResponse
            html.Body.innerHTML = .responseText
        End With
    Set WinHTTP = Nothing
    
    '시작년월 입력
    Set htmlOptions = html.getElementById("start_year").getElementsByTagName("option")

        For i = 0 To htmlOptions.Length - 1
            With Search.Apply_Start
                .AddItem htmlOptions(i).Value
            End With
        Next
        
    '종료년월 입력
    Set htmlOptions = html.getElementById("end_year").getElementsByTagName("option")
   
        For i = 0 To htmlOptions.Length - 1
            With Search.Apply_End
                .AddItem htmlOptions(i).Value
            End With
        Next
    
    '검색지역 입력
    Set htmlOptions = html.getElementById("cate02").getElementsByTagName("option")

        For i = 0 To htmlOptions.Length - 1
            With Search.Apply_Area
                .AddItem htmlOptions(i).Value
            End With
        Next
        
Search.Apply_Start.ListIndex = 0
Search.Apply_End.ListIndex = 0

End Sub


Sub Apply_List()


Search.Search_List.ColumnHeaders.Clear   ' 원래 리스트뷰 컬럼헤더 초기화
Search.Search_List.ListItems.Clear   ' 원래 리스트뷰 아이템 초기화

'----------------------------------------------------------------------------------------------------
' 디폴트 셋팅 ( 컬럼 설정 )
'----------------------------------------------------------------------------------------------------

    With Search.Search_List
        .View = lvwReport
        .AllowColumnReorder = True
        .FullRowSelect = True
        .Gridlines = True
        .HideSelection = False
        .LabelEdit = lvwManual
        .Sorted = False
    End With

    With Search.Search_List.ColumnHeaders
        .Add key:="List0", Text:="No.", Width:=0, Alignment:=lvwColumnLeft   '숨김
        .Add key:="List1", Text:="단지번호", Width:=0, Alignment:=lvwColumnCenter   '숨김
        .Add key:="List2", Text:="지역", Width:=70, Alignment:=lvwColumnCenter
        .Add key:="List3", Text:="주택명", Width:=300, Alignment:=lvwColumnCenter
        .Add key:="List4", Text:="시공사", Width:=0, Alignment:=lvwColumnCenter   '숨김
        .Add key:="List5", Text:="모집공고", Width:=100, Alignment:=lvwColumnCenter
        .Add key:="List6", Text:="청약기간", Width:=200, Alignment:=lvwColumnCenter
        .Add key:="List7", Text:="당첨자발표", Width:=100, Alignment:=lvwColumnCenter
        
        .Add key:="List8", Text:="공급세대수", Width:=80, Alignment:=lvwColumnCenter
        .Add key:="List9", Text:="1순위접수건", Width:=80, Alignment:=lvwColumnCenter
        
        .Add key:="List10", Text:="1순위_당해", Width:=0, Alignment:=lvwColumnCenter   '숨김
        .Add key:="List11", Text:="1순위_기타", Width:=0, Alignment:=lvwColumnCenter   '숨김
        .Add key:="List12", Text:="2순위_당해", Width:=0, Alignment:=lvwColumnCenter   '숨김
        .Add key:="List13", Text:="2순위_기타", Width:=0, Alignment:=lvwColumnCenter   '숨김
        .Add key:="List14", Text:="접수미달", Width:=0, Alignment:=lvwColumnCenter   '숨김
        .Add key:="List15", Text:="접수접수중", Width:=0, Alignment:=lvwColumnCenter   '숨김
        
        .Add key:="List16", Text:="청약결과", Width:=150, Alignment:=lvwColumnCenter
        .Add key:="List17", Text:="평균경쟁률", Width:=80, Alignment:=lvwColumnCenter
        .Add key:="List18", Text:="최고경쟁률", Width:=80, Alignment:=lvwColumnCenter
        
        .Add key:="List19", Text:="모집공고", Width:=0, Alignment:=lvwColumnCenter    '숨김
        .Add key:="List20", Text:="홈페이지", Width:=0, Alignment:=lvwColumnCenter   '숨김
    End With
      
      
            
End Sub



Sub Apply_Run()

    Dim WinHTTP As Object
    Dim html As MSHTML.htmlDocument

    Dim trElements As IHTMLElementCollection   '단지별 타입 순환 컬렉션
    Dim trElement As IHTMLElement   '단지별 타입 순환하기
    Dim trCount As Long
    
    Dim linkElements As MSHTML.IHTMLElementCollection   '단지별 하이퍼링크 순환 컬렉션 ( 모집공고랑 홈페이지 추출할때만 사용 )

    Dim rUrl As String
    Dim Payload As String

    Dim AreaSelect As String   '지역을 받기 위한 인코딩 변수
    Dim Keyword As String   '검색어를 받기 위한 인코딩 변수
    
    Dim i As Integer
    Dim k As Integer   '배열에 저장하기 위한 카운터 변수
    
    Dim type_Check As Integer   '해당지역과 기타지역을 제외한 '경기기타'같은 경우를 체크하기 위한 변수
    Dim type_Cnt As Integer   '타입의 갯수를 확인하기 위한 카운터 변수

    Dim P As Variant

    Dim Apply_Date1 As Date
    Dim Apply_Date2 As Date
    Dim Apply_MonthDiff As Long




'----------------------------------------------------------------------------------------------------------------------------------
'0단계. 오류 점검
'----------------------------------------------------------------------------------------------------------------------------------
   
    ' YYYYMM 형식의 문자열을 날짜로 변환
    ' "YYYY-MM" 형식의 문자열로 변환한 후, CDate 함수를 사용하여 날짜로 변환합니다.
    ' 현재 24년 1월 기준, 청약홈에선 시작월이 2019년 3월이지만 2019년 1월까진 검색가능함.
    Apply_Date1 = CDate(Left(Search.Apply_Start, 4) & "-" & Right(Search.Apply_Start, 2) & "-01")
    Apply_Date2 = CDate(Left(Search.Apply_End, 4) & "-" & Right(Search.Apply_End, 2) & "-01")
       
    ' 두 날짜 사이의 월 차이를 계산
    Apply_MonthDiff = DateDiff("m", Apply_Date1, Apply_Date2)
    
    If Apply_MonthDiff < 0 Then
            MsgBox "종료일은 시작일보다 미래여야 합니다"
            Exit Sub
        ElseIf Apply_MonthDiff > 11 Then   '숫자로 내가 기간을 지정 가능함. 12개월 넘어갈 시 오류나는지 체크 안해봄.
            MsgBox "원활한 기록을 위해 검색기간은 최대 12개월(시작월포함)까지 제한합니다"
            Exit Sub
    End If
    

'----------------------------------------------------------------------------------------------------------------------------------
'1단계. 준비
'----------------------------------------------------------------------------------------------------------------------------------
           
    Call Apply_List
    
    If Search.Apply_Area = "공급지역 전체" Then
            AreaSelect = ""
        Else
            AreaSelect = URLEncode(Search.Apply_Area)
    End If
    
    If Search.Apply_Keyword = "" Then
            Keyword = ""
        Else
            Keyword = URLEncode(Search.Apply_Keyword)
    
    End If

    
'----------------------------------------------------------------------------------------------------------------------------------
'2단계. 페이지 카운팅 ( https://www.applyhome.co.kr/ai/aia/selectAPTLttotPblancListView.do )
'----------------------------------------------------------------------------------------------------------------------------------

    Set html = CreateObject("HtmlFile")

    rUrl = "https://www.applyhome.co.kr/ai/aia/selectAPTLttotPblancListView.do"
    Payload = "beginPd=" & Search.Apply_Start & "&endPd=" & Search.Apply_End & "&houseDetailSecd=01&suplyAreaCode=" & AreaSelect & "&houseNm=" & Keyword & "&pageIndex=1"
    'houseDetailSecd=01   '01 민영으로 고정, 03은 국민, 숫자를 지우면 전체 다 나오게 되므로 여기선 01을 강제로 삽입시켜둠.


    Set WinHTTP = CreateObject("WinHttp.WinHttpRequest.5.1")
        With WinHTTP
            .Open "POST", rUrl
            .setRequestHeader "Content-Type", "application/x-www-form-urlencoded"
            .send Payload
            .waitForResponse
            html.Body.innerHTML = .responseText
        End With
    Set WinHTTP = Nothing

    rCnt = html.getElementsByClassName("total_txt dis_in_imp")(0).getElementsByTagName("span")(0).getElementsByTagName("b")(0).innerHTML
        
    If rCnt = 0 Then
        MsgBox "해당조건으로 검색 결과가 없습니다"
        Exit Sub
    End If
    
    
    pCnt = Application.WorksheetFunction.RoundUp(rCnt / 10, 0)   '게시물 수를 10으로 나눠서 강제 올림

    ReDim P(1 To rCnt, 19)



'----------------------------------------------------------------------------------------------------------------------------------
' 3단계.  페이지별로 순환하며 단지 정보 입력 ( https://www.applyhome.co.kr/ai/aia/selectAPTLttotPblancListView.do )
'----------------------------------------------------------------------------------------------------------------------------------

    k = 1

    For Page_Num = 1 To pCnt

        rUrl = "https://www.applyhome.co.kr/ai/aia/selectAPTLttotPblancListView.do"
        Payload = "beginPd=" & Search.Apply_Start & "&endPd=" & Search.Apply_End & "&houseDetailSecd=01&suplyAreaCode=" & AreaSelect & "&houseNm=" & Keyword & "&pageIndex=" & Page_Num & ""

        Set WinHTTP = CreateObject("WinHttp.WinHttpRequest.5.1")
            With WinHTTP
                .Open "POST", rUrl
                .setRequestHeader "Content-Type", "application/x-www-form-urlencoded"
                .send Payload
                .waitForResponse
                html.Body.innerHTML = .responseText
            End With
        Set WinHTTP = Nothing

        Set trElements = html.getElementsByTagName("tbody")(0).getElementsByTagName("tr")
        trCount = trElements.Length

        For i = 0 To 9
            P(k, 0) = trElements(i).getAttribute("data-hmno") '단지번호
            P(k, 1) = trElements(i).Children(0).innerText    '지역
            P(k, 2) = trElements(i).getAttribute("data-honm")    '주택명
            P(k, 3) = trElements(i).Children(4).innerText   '시공사
            P(k, 4) = trElements(i).Children(6).innerText    '모집공고일
            P(k, 5) = trElements(i).Children(7).innerHTML    '청약기간
            P(k, 6) = trElements(i).Children(8).innerHTML    '당첨자발표

            k = k + 1

            If Page_Num = pCnt Then   '마지막 페이지에서만 이 구문이 활성화되게끔
                If i + 1 = trCount Then 'tr 의 첫번째는 tr(0)부터 시작하므로 tbody의 내용에서 1을 빼서 비교
                    Exit For
                End If
            End If

        Next

        If k = rCnt + 1 Then
            Exit For
        End If

    Next



'----------------------------------------------------------------------------------------------------------------------------------
'4단계. 개별 선택단지의 타입 갯수 추출 ( https://www.applyhome.co.kr/ai/aia/selectAPTCompetitionPopup.do )
'----------------------------------------------------------------------------------------------------------------------------------



    For k = 1 To rCnt

            '개별 선택단지 추출
            rUrl = "https://www.applyhome.co.kr/ai/aia/selectAPTCompetitionPopup.do"
            Payload = "houseManageNo=" & P(k, 0) & "&pblancNo=" & P(k, 0) & "&houseNm=" & URLEncode(P(k, 2)) & "&gvPgmId=AIA01M01"

            Set WinHTTP = CreateObject("WinHttp.WinHttpRequest.5.1")
                With WinHTTP
                    .Open "POST", rUrl
                    .setRequestHeader "Content-Type", "application/x-www-form-urlencoded"
                    .send Payload
                    .waitForResponse
                    html.Body.innerHTML = .responseText
                End With
            Set WinHTTP = Nothing


            '----------------------------------------------------------------------------------------------------------------------------------
            '4-1단계. 개별 선택단지의 타입 갯수 및 공급세대수, 1순위 접수건수 추출
            '----------------------------------------------------------------------------------------------------------------------------------

            '타입갯수 산출 # 1 ( 1순위가 2가지로 나눠져있는지 아니면 3가지로 나눠져 있는지 판단해서 전체 타입 갯수 추출 )
            Set trElements = html.getElementsByTagName("tbody")(0).getElementsByTagName("tr")
            trCount = trElements.Length

            For Each trElement In trElements

'                If trElement.getAttribute("data-ty") <> "" Then

                    '공급세대수 산출
                    If InStr(trElement.getAttribute("data-sem"), "해당지역") > 0 Then
                        If trElement.Children(2).innerText = "1순위" Then
                            P(k, 7) = P(k, 7) + Int(trElement.Children(1).innerText)
                            P(k, 7) = Format(P(k, 7), "#,##0")
                        End If
                    End If

                    '1순위 청약접수건수 ( 당해 + 기타 ) 산출
                    If trElement.Children(2).innerText = "1순위" Then
                        P(k, 8) = P(k, 8) + Int(trElement.Children(4).innerText)
                        P(k, 8) = Format(P(k, 8), "#,##0")
                    End If

                    '순위에서 '지역'이라는 말이 포함되어 있지 않다면 / 즉, 해당지역과 기타지역 외 다른 구분이 있다면 cnt 증가
                    If InStr(trElement.getAttribute("data-sem"), "지역") = 0 Then
                        type_Check = type_Check + 1
                    End If

'                End If

            Next trElement

            '!!!--------------------------------------------------------------------------------------------------------------------------------
            '아래처럼 코드를 작성하면 오류가 발생
            'P(k, 15) = Format(P(k, 8), "0.0") / Format(P(k, 7), "0.0")   -> 소수점 처리 안됨
            'Format(P(k, 15), "0.0") = P(k, 8) / P(k, 7)   -> 개체가 필요하다는 오류 발생
            'Format(P(k, 15), "0.0") = Format(P(k, 8), "0.0") / Format(P(k, 7), "0.0")   -> 개체가 필요하다는 오류 발생

            '오류 발생 이유는 다음과 같다.
            'Format(P(k, 15), "0.00") = P(k, 8) / P(k, 7) 코드에서 오류가 발생하는 이유는 대입 연산의 사용 방식에 문제가 있기 때문입니다.
            'Format() 함수는 결과값을 포맷하여 반환하는 함수로, 결과값에 대한 포맷을 지정한 후 이를 변수에 대입해야 합니다.
            '즉, 포맷 함수의 결과를 변수에 할당하는 방식으로 코드를 작성해야 합니다. 하지만, 여기서는 Format() 함수를 사용하는 방식이 잘못되었습니다.            '
            '문제를 해결하기 위해, 먼저 P(k, 8) / P(k, 7)의 연산 결과를 P(k, 15)에 할당한 후, 이 값을 포맷하여 다시 P(k, 15)에 할당하거나 적절한 변수에 저장하는 방식으로 코드를 수정해야 합니다.
            '!!!--------------------------------------------------------------------------------------------------------------------------------

            P(k, 16) = P(k, 8) / P(k, 7)
            P(k, 16) = Format(P(k, 16), "0.00")


            '타입갯수 산출 # 2 ( 해당지역과 기타지역일 경우는 4로, 기타경기까지 추가로 있으면 6개로 나눠야 됨. ex. 4개로 나눌 경우는 1순위 당해 / 1순위 기타 / 2순위 당해 / 2순위 기타 )
            type_Cnt = html.getElementsByTagName("tbody")(0).getElementsByTagName("tr").Length - 1   '1을 빼는 이유는 모든 타입에서 마지막 부분에 총합계로 <tr> 태그 한개가 추가되므로 1개를 빼야지 갯수가 맞음 )

                If type_Check = 0 Then
                        type_Cnt = type_Cnt / 4
                    Else
                        type_Cnt = type_Cnt / 6
                End If


            '------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
            '4-2단계. 청약경쟁률 ( 모집세대수를 제외한 500%의 예비입주자가 모여야 마감임. 즉, 공급세대수 대비 600% 가산,'1순위에서 경쟁이 발생했더라도 예비입주자가 500%를 넘지 않으면 청약 미달로 처리
            '------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
            If trElements(0).Children(6).innerText <> "청약 접수일 미도래" Then

                    For i = 0 To trCount - 2
                    '2를 빼는 이유는 TR태그의 맨 마지막에 총합계가 있고 1을 빼고,
                    '추가로 trElements 의 순환은 0부터 시작하므로, trElements의 첫번째 0번이 컬렉션 내부에서 아이템 번호는 1번으로 지정된 것을 가리키므로 이 차이 때문에, 1을 빼서,
                    '총 trCount 에서 2를 빼게 됨.

                        '가끔 1순위 해당지역에서도 미달(△)이 발생하는 경우가 있어, 이런 경우는 패스하고 아니면 이전 입력된 경쟁률과 계속 비교해 최고 경쟁률 데이터 갱신
                        If InStr(trElements(i).Children(5).innerText, "△") = 0 Then   '청약 미달(△)이 표시된 경우가 아니라면..
                            If trElements(i).Children(5).innerText <> "" Then   '23년 2월 16일에 공고를 낸 울진후포 오션더캐슬은 청약접수건가 전체 0건으로 순위내 경쟁률 칸이 여백으로 되어있는 경우등도 있어서 이 코드 포함.
                                If CSng(P(k, 17)) < CSng(trElements(i).Children(5).innerText) Then
                                    P(k, 17) = CSng(trElements(i).Children(5).innerText)
                                    P(k, 17) = Format(P(k, 17), "0.00")
                                End If
                            End If
                            
'                            If CSng(P(k, 17)) < CSng(trElements(i).Children(5).innerText) Then
'                                P(k, 17) = CSng(trElements(i).Children(5).innerText)
'                                P(k, 17) = Format(P(k, 17), "0.00")
'                            End If
                        End If

                        If type_Check = 0 Then

                                '1순위 해당지역 P(i, 9)
                                If trElements(i).Children(6).innerText = "1순위 마감(청약 접수 종료)" Then
                                                P(k, 9) = P(k, 9) + 1
                                    '1순위 기타지역 P(i, 10)
                                    ElseIf Int(trElements(i).Children(1).innerText) * 6 _
                                            < Int(trElements(i).Children(4).innerText) _
                                            + Int(trElements(i + 1).Children(4).innerText) Then
                                                P(k, 10) = P(k, 10) + 1

                                    '2순위 해당지역 P(i, 11)
                                    ElseIf Int(trElements(i).Children(1).innerText) * 6 _
                                            < Int(trElements(i).Children(4).innerText) _
                                            + Int(trElements(i + 1).Children(4).innerText) _
                                            + Int(trElements(i + 2).Children(4).innerText) Then
                                                P(k, 11) = P(k, 11) + 1

                                    '2순위 기타지역 P(i, 12)
                                    ElseIf Int(trElements(i).Children(1).innerText) * 6 _
                                            < Int(trElements(i).Children(4).innerText) _
                                            + Int(trElements(i + 1).Children(4).innerText) _
                                            + Int(trElements(i + 2).Children(4).innerText) _
                                            + Int(trElements(i + 3).Children(4).innerText) Then
                                                P(k, 12) = P(k, 12) + 1

                                    '청약 접수중 P(i, 14)
                                    ElseIf trElements(i).Children(6).innerText = "청약 접수중" Then
                                                P(k, 14) = P(k, 14) + 1

                                    '청약 미달
                                    Else
                                                P(k, 13) = P(k, 13) + 1


                                End If

                               '1순위 해당지역만 체크하기 위해서 ' i + 3 '을 해줌.
                                i = i + 3

                            ElseIf type_Check > 0 Then   '각 순위별 3개의 지역구분이 있을 경우 ( 해당지역, 기타경기, 기타지역 )


                                '1순위 해당지역 P(i, 9)
                                If trElements(i).Children(6).innerText = "1순위 마감(청약 접수 종료)" Then
                                                P(k, 9) = P(k, 9) + 1

                                    '1순위 기타지역 P(i, 10)
                                    ElseIf Int(trElements(i).Children(1).innerText) * 6 _
                                            < Int(trElements(i).Children(4).innerText) _
                                            + Int(trElements(i + 1).Children(4).innerText) _
                                            + Int(trElements(i + 2).Children(4).innerText) Then
                                                P(k, 10) = P(k, 10) + 1

                                    '2순위 해당지역 P(i, 11)
                                    ElseIf Int(trElements(i).Children(1).innerText) * 6 _
                                            < Int(trElements(i).Children(4).innerText) _
                                            + Int(trElements(i + 1).Children(4).innerText) _
                                            + Int(trElements(i + 2).Children(4).innerText) _
                                            + Int(trElements(i + 3).Children(4).innerText) Then
                                                P(k, 11) = P(k, 11) + 1

                                    '2순위 기타경기 + 2순위 기타지역 P(i, 12)
                                    ElseIf Int(trElements(i).Children(1).innerText) * 6 _
                                            < Int(trElements(i).Children(4).innerText) _
                                            + Int(trElements(i + 1).Children(4).innerText) _
                                            + Int(trElements(i + 2).Children(4).innerText) _
                                            + Int(trElements(i + 3).Children(4).innerText) _
                                            + Int(trElements(i + 4).Children(4).innerText) _
                                            + Int(trElements(i + 5).Children(4).innerText) Then
                                                P(k, 12) = P(k, 12) + 1

                                    '청약 접수중 P(i, 14)
                                    ElseIf trElements(i).Children(6).innerText = "청약 접수중" Then
                                                P(k, 14) = P(k, 14) + 1

                                    '청약 미달
                                    Else
                                                P(k, 13) = P(k, 13) + 1


                                End If
'
                                '1순위 해당지역만 체크하기 위해서 ' i + 5 '을 해줌.
                                i = i + 5
'
                        End If

                    Next i


                        If P(k, 9) = type_Cnt Then   '1순위 당해로 전부 마감됐을 때
                            P(k, 15) = "1순위 당해마감"
                            ElseIf P(k, 10) > 0 And P(k, 11) = 0 And P(k, 12) = 0 Then   '1순위 기타로 전부 마감됐을 때 ( 1순위 기타는 1개 이상, 2순위들은 전부 0 일 때 )
                                P(k, 15) = "1순위 기타마감"
                            ElseIf P(k, 11) > 0 And P(k, 12) = 0 Then   '2순위 당해로 마감됐을 때 ( 2순위 당해는 1개 이상, 2순위 기타는 0 일 때 )
                                P(k, 15) = "2순위 당해마감"
                            ElseIf P(k, 12) > 0 Then   '2순위 기타 마감
                                P(k, 15) = "2순위 기타마감"
                            ElseIf P(k, 13) = type_Cnt Then   '전체 미달
                                P(k, 15) = "전체 미달"
                            ElseIf P(k, 14) > 0 Then
                                P(k, 15) = "청약 접수중"
                            ElseIf P(k, 13) > 0 Then
                                P(k, 15) = "일부타입 미달"
                        End If



                Else   '청약 접수일 미도래'일 경우
                    P(k, 8) = "-"
                    P(k, 9) = "-"
                    P(k, 10) = "-"
                    P(k, 11) = "-"
                    P(k, 12) = "-"
                    P(k, 13) = "-"
                    P(k, 14) = "-"
                    P(k, 15) = "청약 접수일 미도래"
                    P(k, 16) = "-"
                    P(k, 17) = "-"

            End If

            type_Check = 0

    Next k





'----------------------------------------------------------------------------------------------------------------------------------
'5단계. 모집공고와 홈페이지 링크 삽입시 진행
'----------------------------------------------------------------------------------------------------------------------------------


    
    If Search.Apply_Notice.Value = True Or Search.Apply_Homepage.Value = True Then
        
        For k = 1 To rCnt
        
            rUrl = "https://www.applyhome.co.kr/ai/aia/selectAPTLttotPblancDetail.do"
            Payload = "houseManageNo=" & P(k, 0) & "&pblancNo=" & P(k, 0) & "&gvPgmId=AIA01M01"
    
            Set WinHTTP = CreateObject("WinHttp.WinHttpRequest.5.1")
                With WinHTTP
                    .Open "POST", rUrl
                    .setRequestHeader "Content-Type", "application/x-www-form-urlencoded"
                    .send Payload
                    .waitForResponse
                    html.Body.innerHTML = .responseText
                End With
            Set WinHTTP = Nothing
    
            ' 모든 <a> 태그 찾기
            Set linkElements = html.getElementsByTagName("a")
    
                If Search.Apply_Notice.Value = True Then
                    P(k, 18) = linkElements(1) '모집공고 링크
                End If
                
                If Search.Apply_Homepage.Value = True Then
                    P(k, 19) = linkElements(2) '홈페이지 링크
                End If
            
        Next
        
    End If



'----------------------------------------------------------------------------------------------------------------------------------
'6단계. 배열에 입력된 내용 전부 리스트뷰에 출력
'----------------------------------------------------------------------------------------------------------------------------------

    With Search.Search_List
        For i = 1 To rCnt
            .ListItems.Add Text:=i
            For k = 0 To 19
                .ListItems(i).SubItems(k + 1) = P(i, k)
            Next
        Next
    End With
    

End Sub


