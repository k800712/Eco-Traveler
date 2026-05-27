import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';

class RefundScreen extends StatefulWidget {
  const RefundScreen({super.key});

  @override
  State<RefundScreen> createState() => _RefundScreenState();
}

class _RefundScreenState extends State<RefundScreen> {
  final _formKey = GlobalKey<FormState>();
  String _selectedBank = '국민은행';
  final _accountController = TextEditingController();
  final _holderController = TextEditingController();
  final _amountController = TextEditingController();

  @override
  void dispose() {
    _accountController.dispose();
    _holderController.dispose();
    _amountController.dispose();
    super.dispose();
  }

  void _submitRefund(AppState appState) {
    if (!_formKey.currentState!.validate()) return;
    
    int amount = int.parse(_amountController.text);
    
    if (amount > appState.points) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('보유하신 포인트 내에서만 환급 신청이 가능합니다.'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    bool success = appState.requestRefund(
      amount: amount,
      bank: _selectedBank,
      account: _accountController.text,
      holder: _holderController.text,
    );

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('🏦 ${amount}원 환급 신청이 접수되었습니다!'),
          backgroundColor: Colors.green[800],
        ),
      );
      
      // 폼 비우기
      _accountController.clear();
      _holderController.clear();
      _amountController.clear();
    }
  }

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // 보유 포인트 카드
          Card(
            color: Colors.white.withOpacity(0.02),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
              side: BorderSide(color: Colors.white.withOpacity(0.04)),
            ),
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('현재 보유 포인트', style: TextStyle(fontSize: 12, color: Colors.grey)),
                      const SizedBox(height: 4),
                      Text(
                        '${appState.points} P',
                        style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.greenAccent),
                      ),
                    ],
                  ),
                  const Icon(Icons.account_balance_wallet, color: Colors.greenAccent, size: 32),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),

          // 환급 신청 폼
          const Text('은행 계좌 머니백 신청', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white)),
          const SizedBox(height: 8),
          
          Card(
            color: Colors.white.withOpacity(0.02),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
              side: BorderSide(color: Colors.white.withOpacity(0.04)),
            ),
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // 은행선택
                    DropdownButtonFormField<String>(
                      value: _selectedBank,
                      decoration: const InputDecoration(
                        labelText: '입금 은행',
                        contentPadding: EdgeInsets.symmetric(horizontal: 12),
                      ),
                      dropdownColor: Colors.grey[950],
                      onChanged: (bank) {
                        if (bank != null) {
                          setState(() {
                            _selectedBank = bank;
                          });
                        }
                      },
                      items: const [
                        DropdownMenuItem(value: '국민은행', child: Text('국민은행')),
                        DropdownMenuItem(value: '신한은행', child: Text('신한은행')),
                        DropdownMenuItem(value: '우리은행', child: Text('우리은행')),
                        DropdownMenuItem(value: '하나은행', child: Text('하나은행')),
                        DropdownMenuItem(value: '카카오뱅크', child: Text('카카오뱅크')),
                        DropdownMenuItem(value: '토스뱅크', child: Text('토스뱅크')),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // 계좌번호
                    TextFormField(
                      controller: _accountController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: '계좌 번호 (숫자만 입력)',
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) return '계좌 번호를 입력해주세요.';
                        return null;
                      },
                    ),
                    const SizedBox(height: 12),

                    // 예금주
                    TextFormField(
                      controller: _holderController,
                      decoration: const InputDecoration(
                        labelText: '예금주 성함',
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) return '예금주 성함을 입력해주세요.';
                        return null;
                      },
                    ),
                    const SizedBox(height: 12),

                    // 신청금액
                    TextFormField(
                      controller: _amountController,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        labelText: '신청 금액 (최소 5,000원)',
                        suffixIcon: TextButton(
                          onPressed: () {
                            _amountController.text = appState.points.toString();
                          },
                          child: const Text('최대', style: TextStyle(color: Colors.greenAccent)),
                        ),
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) return '환급 신청 금액을 입력해주세요.';
                        int? amt = int.tryParse(value);
                        if (amt == null) return '숫자만 입력 가능합니다.';
                        if (amt < 5000) return '최소 5,000원 이상만 신청 가능합니다.';
                        return null;
                      },
                    ),
                    const SizedBox(height: 20),

                    ElevatedButton(
                      onPressed: () => _submitRefund(appState),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.greenAccent,
                        foregroundColor: Colors.black,
                        minimumSize: const Size(double.infinity, 46),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('환급 신청하기', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 20),

          // 최근 환급 내역
          const Text('최근 머니백 내역', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white)),
          const SizedBox(height: 8),

          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: appState.refundHistory.length,
            itemBuilder: (context, index) {
              final record = appState.refundHistory[index];
              return Card(
                color: Colors.white.withOpacity(0.01),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: BorderSide(color: Colors.white.withOpacity(0.03)),
                ),
                margin: const EdgeInsets.only(bottom: 10),
                child: ListTile(
                  title: Text('${record.bank} 환급 신청', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                  subtitle: Text('${record.account} | ${record.date}', style: const TextStyle(fontSize: 10, color: Colors.grey)),
                  trailing: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text('-${record.amount} 원', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white)),
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: record.status == '처리중' 
                              ? Colors.amberAccent.withOpacity(0.15) 
                              : Colors.greenAccent.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          record.status,
                          style: TextStyle(
                            fontSize: 9, 
                            fontWeight: FontWeight.bold,
                            color: record.status == '처리중' ? Colors.amberAccent : Colors.greenAccent
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}
