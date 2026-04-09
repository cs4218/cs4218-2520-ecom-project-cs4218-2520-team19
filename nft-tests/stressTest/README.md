// Varatharaju Mithuna, A0281223N Stress Testing

## Non-Functional Testing (MS3)

Tool used: Apache JMeter

Test cases created by:
Mithuna Varatharaju (A0281223N)

Work done:
- Created JMeter test plan (.jmx file)
- Configured Thread Group to simulate load from 50 users up to 5500 users
- Measured response time, throughput and error rate
- Exported results as CSV and screenshots

Files:
stress_test_50_to_5500_users.jmx

# Results:
summary 5000.csv
aggregate 5000.csv

Note:
The same JMeter test plan file was reused by adjusting the thread count (number of users) from 50 up to 5500 to 
perform stress testing at different load levels. 
Results were generated for each load level to observe system performance trends such as response time, 
throughput, and error rate.